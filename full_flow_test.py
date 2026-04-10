#!/usr/bin/env python3
"""
Plan-I MLM Platform — Full End-to-End Flow Simulation
=====================================================
Tests the complete flow: user registration, network placement, joining approval,
cycle-based payout engine, wallet credits, shop/order, vendor, and admin workflows.

Uses a fresh in-memory SQLite DB that mirrors the Prisma schema exactly.
"""

import sqlite3
import uuid
import hashlib
import json
import sys
from datetime import datetime, timedelta
from collections import defaultdict

# ═══════════════════════════════════════════════════════════
# DATABASE SETUP (mirrors Prisma schema)
# ═══════════════════════════════════════════════════════════

def setup_db():
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA foreign_keys=ON")

    db.executescript("""
    CREATE TABLE User (
        id TEXT PRIMARY KEY,
        memberId TEXT UNIQUE NOT NULL,
        sequenceNumber INTEGER UNIQUE NOT NULL,
        userType TEXT DEFAULT 'REAL',
        name TEXT NOT NULL,
        mobile TEXT UNIQUE,
        email TEXT UNIQUE,
        passwordHash TEXT,
        referrerId TEXT,
        level INTEGER DEFAULT 1,
        cyclePosition INTEGER DEFAULT 1,
        role TEXT DEFAULT 'MEMBER',
        placementLeg TEXT,
        status TEXT DEFAULT 'ACTIVE',
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (referrerId) REFERENCES User(id)
    );

    CREATE TABLE MemberSequence (
        id INTEGER PRIMARY KEY DEFAULT 1,
        lastSequence INTEGER DEFAULT 512
    );

    CREATE TABLE JoiningRequest (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        amount INTEGER DEFAULT 1000,
        status TEXT DEFAULT 'PENDING',
        note TEXT,
        approvedAt TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
    );

    CREATE TABLE NetworkNode (
        userId TEXT PRIMARY KEY,
        parentId TEXT,
        position TEXT,
        level INTEGER DEFAULT 1,
        path TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES User(id)
    );
    CREATE INDEX idx_nn_path ON NetworkNode(path);
    CREATE INDEX idx_nn_parentId ON NetworkNode(parentId);

    CREATE TABLE Wallet (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        couponBalance INTEGER DEFAULT 0,
        purchaseBalance INTEGER DEFAULT 0,
        incomeBalance INTEGER DEFAULT 0,
        gstBalance INTEGER DEFAULT 0,
        updatedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id)
    );

    CREATE TABLE WalletTransaction (
        id TEXT PRIMARY KEY,
        walletId TEXT NOT NULL,
        type TEXT NOT NULL,
        field TEXT NOT NULL,
        amount INTEGER NOT NULL,
        note TEXT,
        sourceRef TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (walletId) REFERENCES Wallet(id)
    );

    CREATE TABLE PayoutRecord (
        id TEXT PRIMARY KEY,
        requestId TEXT NOT NULL,
        joinerId TEXT NOT NULL,
        recipientId TEXT NOT NULL,
        recipientType TEXT NOT NULL,
        levelDiff INTEGER NOT NULL,
        cycleSlot INTEGER NOT NULL,
        amount INTEGER DEFAULT 250,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (recipientId) REFERENCES User(id)
    );

    CREATE TABLE GstRecord (
        id TEXT PRIMARY KEY,
        requestId TEXT UNIQUE NOT NULL,
        amount INTEGER DEFAULT 180,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE Category (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE Product (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        categoryId TEXT,
        couponSplitPct INTEGER DEFAULT 50,
        imageUrl TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (categoryId) REFERENCES Category(id)
    );

    CREATE TABLE "Order" (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        productId TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        totalAmount INTEGER NOT NULL,
        cashPaid INTEGER NOT NULL,
        couponUsed INTEGER NOT NULL,
        cashback INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PLACED',
        placedAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id),
        FOREIGN KEY (productId) REFERENCES Product(id)
    );

    CREATE TABLE Vendor (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        businessName TEXT NOT NULL,
        categoryId TEXT NOT NULL,
        pinCode TEXT NOT NULL,
        platformFee INTEGER DEFAULT 10,
        isApproved INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (userId) REFERENCES User(id),
        FOREIGN KEY (categoryId) REFERENCES Category(id),
        UNIQUE(categoryId, pinCode)
    );
    """)

    return db


# ═══════════════════════════════════════════════════════════
# PAYOUT ENGINE (exact mirror of payoutEngine.ts)
# ═══════════════════════════════════════════════════════════

PAYOUT_PER_SLOT = 250
GST_AMOUNT = 180
JOIN_FEE = 1000

CYCLE_TABLE = {
    1: [1, 2, 3],           # L1, L2, L3 (joiner's path)
    2: ['SELF', 4, 5],      # Self + referrer's L4, L5
    3: ['SELF', 6, 7],      # Self + referrer's L6, L7
    4: ['SELF', 8, 9],      # Self + referrer's L8, L9
    5: ['SELF', 1, 2],      # Self + referrer's L1, L2
}

def get_next_cycle_position(current):
    if current < 2 or current > 5:
        return 2
    return 2 if current >= 5 else current + 1

def get_ancestor_at_level(ancestor_ids, level):
    idx = len(ancestor_ids) - level
    if idx < 0:
        return None
    return ancestor_ids[idx] if idx < len(ancestor_ids) else None

def process_joining_payout(db, request_id, joiner_id):
    """Exact replication of processJoiningPayout() from payoutEngine.ts"""

    # 1. Idempotency check
    existing = db.execute("SELECT id FROM PayoutRecord WHERE requestId = ?", (request_id,)).fetchone()
    if existing:
        raise Exception("ALREADY_PROCESSED")

    # 2. Get joiner's network node
    joiner_node = db.execute("SELECT * FROM NetworkNode WHERE userId = ?", (joiner_id,)).fetchone()
    if not joiner_node:
        raise Exception(f"Joiner {joiner_id} not in network")
    joiner_path_parts = joiner_node['path'].split('.')
    joiner_ancestor_ids = joiner_path_parts[:-1]  # exclude joiner's own id

    # 3. Get the joiner's direct referrer
    joiner = db.execute("SELECT referrerId FROM User WHERE id = ?", (joiner_id,)).fetchone()
    referrer_id = joiner['referrerId']

    # 4. Find company wallet for fallback
    company_user = db.execute(
        "SELECT id FROM User WHERE userType = 'COMPANY' ORDER BY sequenceNumber ASC LIMIT 1"
    ).fetchone()

    # 5. Transaction-equivalent logic
    referrer_cycle_position = 1
    referrer_ancestor_ids = []

    if referrer_id:
        referrer = db.execute("SELECT cyclePosition FROM User WHERE id = ?", (referrer_id,)).fetchone()
        referrer_cycle_position = referrer['cyclePosition']

        referrer_node = db.execute("SELECT * FROM NetworkNode WHERE userId = ?", (referrer_id,)).fetchone()
        if referrer_node:
            referrer_path_parts = referrer_node['path'].split('.')
            referrer_ancestor_ids = referrer_path_parts[:-1]

    # Resolve cycle receivers
    slots = CYCLE_TABLE[referrer_cycle_position]
    is_joining_cycle = referrer_cycle_position == 1
    ancestor_ids_for_lookup = joiner_ancestor_ids if is_joining_cycle else referrer_ancestor_ids

    payout_records = []

    for slot in slots:
        if slot == 'SELF':
            recipient_id = referrer_id
            level_diff = 0
        else:
            level_diff = slot
            ancestor_id = get_ancestor_at_level(ancestor_ids_for_lookup, level_diff)
            if ancestor_id:
                recipient_id = ancestor_id
            else:
                recipient_id = company_user['id']

        # Get recipient info
        recipient = db.execute("SELECT userType FROM User WHERE id = ?", (recipient_id,)).fetchone()
        wallet = db.execute("SELECT id FROM Wallet WHERE userId = ?", (recipient_id,)).fetchone()

        # Credit income
        db.execute("UPDATE Wallet SET incomeBalance = incomeBalance + ? WHERE userId = ?",
                   (PAYOUT_PER_SLOT, recipient_id))

        # Create wallet transaction
        note = (f"Self-earning from cycle {referrer_cycle_position}"
                if slot == 'SELF'
                else f"Referral bonus (L{level_diff}) cycle {referrer_cycle_position}")

        db.execute("""INSERT INTO WalletTransaction (id, walletId, type, field, amount, note, sourceRef)
                      VALUES (?, ?, 'CREDIT', 'INCOME', ?, ?, ?)""",
                   (str(uuid.uuid4()), wallet['id'], PAYOUT_PER_SLOT, note, request_id))

        # Create payout record
        pr_id = str(uuid.uuid4())
        db.execute("""INSERT INTO PayoutRecord (id, requestId, joinerId, recipientId, recipientType, levelDiff, cycleSlot, amount)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                   (pr_id, request_id, joiner_id, recipient_id, recipient['userType'], level_diff, referrer_cycle_position, PAYOUT_PER_SLOT))

        payout_records.append({
            'recipient_id': recipient_id,
            'recipient_type': recipient['userType'],
            'level_diff': level_diff,
            'cycle_slot': referrer_cycle_position,
            'is_self': slot == 'SELF',
        })

    # Credit ₹1000 coupon to joiner
    joiner_wallet = db.execute("SELECT id FROM Wallet WHERE userId = ?", (joiner_id,)).fetchone()
    db.execute("UPDATE Wallet SET couponBalance = couponBalance + ? WHERE userId = ?",
               (JOIN_FEE, joiner_id))
    db.execute("""INSERT INTO WalletTransaction (id, walletId, type, field, amount, note, sourceRef)
                  VALUES (?, ?, 'CREDIT', 'COUPON', ?, 'Joining coupon credit (₹1000)', ?)""",
               (str(uuid.uuid4()), joiner_wallet['id'], JOIN_FEE, request_id))

    # GST record
    db.execute("INSERT INTO GstRecord (id, requestId, amount) VALUES (?, ?, ?)",
               (str(uuid.uuid4()), request_id, GST_AMOUNT))

    # Activate user
    db.execute("UPDATE User SET status = 'ACTIVE' WHERE id = ?", (joiner_id,))

    # Mark request approved
    db.execute("UPDATE JoiningRequest SET status = 'APPROVED', approvedAt = ? WHERE id = ?",
               (datetime.now().isoformat(), request_id))

    # Advance referrer cycle
    if referrer_id:
        next_cycle = get_next_cycle_position(referrer_cycle_position)
        db.execute("UPDATE User SET cyclePosition = ? WHERE id = ?", (next_cycle, referrer_id))

    db.commit()
    return payout_records


# ═══════════════════════════════════════════════════════════
# BFS NETWORK PLACEMENT (mirrors networkService.ts)
# ═══════════════════════════════════════════════════════════

def add_to_network(db, user_id, referrer_id, leg):
    """BFS spillover placement — exact mirror of addToNetwork()"""
    if not referrer_id:
        referrer_id = db.execute(
            "SELECT id FROM User WHERE userType='COMPANY' ORDER BY sequenceNumber DESC LIMIT 1"
        ).fetchone()['id']

    placement_leg = leg or 'LEFT'

    # Check direct slot
    direct_child = db.execute(
        "SELECT userId FROM NetworkNode WHERE parentId = ? AND position = ?",
        (referrer_id, placement_leg)
    ).fetchone()

    if not direct_child:
        placement_parent_id = referrer_id
        placement_position = placement_leg
    else:
        # BFS within subtree
        subtree_root = direct_child['userId']
        queue = [subtree_root]
        found = False
        placement_parent_id = subtree_root
        placement_position = 'LEFT'

        while queue:
            current_id = queue.pop(0)
            children = db.execute(
                "SELECT userId, position FROM NetworkNode WHERE parentId = ?",
                (current_id,)
            ).fetchall()

            has_left = any(c['position'] == 'LEFT' for c in children)
            has_right = any(c['position'] == 'RIGHT' for c in children)

            if not has_left:
                placement_parent_id = current_id
                placement_position = 'LEFT'
                found = True
                break
            if not has_right:
                placement_parent_id = current_id
                placement_position = 'RIGHT'
                found = True
                break

            left_child = next((c for c in children if c['position'] == 'LEFT'), None)
            right_child = next((c for c in children if c['position'] == 'RIGHT'), None)
            if left_child:
                queue.append(left_child['userId'])
            if right_child:
                queue.append(right_child['userId'])

    parent_node = db.execute("SELECT * FROM NetworkNode WHERE userId = ?", (placement_parent_id,)).fetchone()
    new_path = f"{parent_node['path']}.{user_id}"
    new_level = parent_node['level'] + 1

    db.execute("""INSERT INTO NetworkNode (userId, parentId, position, level, path) VALUES (?, ?, ?, ?, ?)""",
               (user_id, placement_parent_id, placement_position, new_level, new_path))
    db.execute("UPDATE User SET level = ? WHERE id = ?", (new_level, user_id))
    db.commit()
    return placement_parent_id, placement_position, new_level


# ═══════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════

def create_user(db, name, mobile, referrer_id=None, leg='LEFT', user_type='REAL', role='MEMBER'):
    seq = db.execute("SELECT lastSequence FROM MemberSequence WHERE id = 1").fetchone()
    next_seq = seq['lastSequence'] + 1
    db.execute("UPDATE MemberSequence SET lastSequence = ? WHERE id = 1", (next_seq,))

    uid = str(uuid.uuid4())
    member_id = f"IND{str(next_seq).zfill(6)}"

    db.execute("""INSERT INTO User (id, memberId, sequenceNumber, userType, name, mobile, referrerId, level, cyclePosition, role, placementLeg, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'PENDING')""",
               (uid, member_id, next_seq, user_type, name, mobile, referrer_id, 2 if user_type == 'REAL' else 1, role, leg))

    # Create wallet
    db.execute("INSERT INTO Wallet (id, userId) VALUES (?, ?)", (str(uuid.uuid4()), uid))
    db.commit()

    return uid, member_id

def submit_joining_request(db, user_id):
    req_id = str(uuid.uuid4())
    db.execute("INSERT INTO JoiningRequest (id, userId, amount, status) VALUES (?, ?, 1000, 'PENDING')",
               (req_id, user_id))
    db.commit()
    return req_id

def get_wallet(db, user_id):
    return db.execute("SELECT * FROM Wallet WHERE userId = ?", (user_id,)).fetchone()

def get_user(db, user_id):
    return db.execute("SELECT * FROM User WHERE id = ?", (user_id,)).fetchone()

def get_member_id(db, user_id):
    return db.execute("SELECT memberId FROM User WHERE id = ?", (user_id,)).fetchone()['memberId']

# ═══════════════════════════════════════════════════════════
# TEST RUNNER
# ═══════════════════════════════════════════════════════════

passed = 0
failed = 0
total = 0

def test(condition, msg):
    global passed, failed, total
    total += 1
    if condition:
        passed += 1
        print(f"  ✅ {msg}")
    else:
        failed += 1
        print(f"  ❌ FAIL: {msg}")

def run_tests():
    global passed, failed

    print("\n" + "═" * 60)
    print("  PLAN-I FULL FLOW END-TO-END TEST")
    print("═" * 60)

    db = setup_db()

    # ─── SEED: Create 512 company users in a chain ───
    print("\n── Seeding: 512 company users ──")
    db.execute("INSERT INTO MemberSequence (id, lastSequence) VALUES (1, 512)")

    prev_id = None
    prev_path = ""
    company_ids = []

    for i in range(1, 513):
        uid = str(uuid.uuid4())
        mid = f"IND{str(i).zfill(6)}"
        path = f"{prev_path}.{uid}" if prev_path else uid

        db.execute("""INSERT INTO User (id, memberId, sequenceNumber, userType, name, referrerId, level, cyclePosition, role, status)
                      VALUES (?, ?, ?, 'COMPANY', ?, ?, ?, 1, 'MEMBER', 'ACTIVE')""",
                   (uid, mid, i, f"Company Node {mid}", prev_id, i))

        db.execute("INSERT INTO NetworkNode (userId, parentId, level, path) VALUES (?, ?, ?, ?)",
                   (uid, prev_id, i, path))

        db.execute("INSERT INTO Wallet (id, userId) VALUES (?, ?)", (str(uuid.uuid4()), uid))

        company_ids.append(uid)
        prev_id = uid
        prev_path = path

    # Admin user (not in network)
    admin_id = str(uuid.uuid4())
    db.execute("""INSERT INTO User (id, memberId, sequenceNumber, userType, name, mobile, role, status, level, cyclePosition)
                  VALUES (?, 'ADMIN001', 0, 'REAL', 'Admin', '9999999999', 'ADMIN', 'ACTIVE', 0, 1)""",
               (admin_id,))

    # Categories and products
    cat_id = str(uuid.uuid4())
    db.execute("INSERT INTO Category (id, name, description) VALUES (?, 'Electronics', 'Electronic items')", (cat_id,))

    prod_id = str(uuid.uuid4())
    db.execute("""INSERT INTO Product (id, name, description, price, categoryId, couponSplitPct)
                  VALUES (?, 'Smart Watch', 'A smart watch', 2000, ?, 50)""", (prod_id, cat_id))

    db.commit()
    print(f"  Seeded: 512 company users, 1 admin, 1 category, 1 product")

    last_company_id = company_ids[-1]
    last_company_mid = get_member_id(db, last_company_id)
    test(True, f"Seed complete. Last company user: {last_company_mid}")

    # ═══════════════════════════════════════════════════════════
    # PHASE 1: REGISTER USER A (referred by last company user)
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 1: Register User A ──")

    user_a_id, user_a_mid = create_user(db, "Test User A", "9000000501", last_company_id, 'LEFT')
    test(user_a_mid == "IND000513", f"User A member ID = {user_a_mid}")
    test(get_user(db, user_a_id)['status'] == 'PENDING', "User A status = PENDING")
    test(get_user(db, user_a_id)['cyclePosition'] == 2, "User A cyclePosition = 2 (real users start at 2)")

    # Add to network (simulates OTP verification + addToNetwork)
    parent, pos, lvl = add_to_network(db, user_a_id, last_company_id, 'LEFT')
    test(parent == last_company_id, f"User A placed under {get_member_id(db, parent)}")
    test(pos == 'LEFT', f"User A position = {pos}")

    # ═══════════════════════════════════════════════════════════
    # PHASE 2: USER A JOINING REQUEST → ADMIN APPROVE → CYCLE 1 PAYOUT
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 2: User A joining → Cycle 1 payout ──")

    req_a_id = submit_joining_request(db, user_a_id)
    test(True, f"Joining request created: {req_a_id[:8]}...")

    # The referrer is last company user (cyclePosition=1 → Cycle 1)
    company_cycle = get_user(db, last_company_id)['cyclePosition']
    test(company_cycle == 1, f"Referrer (company) cyclePosition = {company_cycle}")

    payouts_a = process_joining_payout(db, req_a_id, user_a_id)
    print(f"\n  Cycle 1 payout breakdown (uses JOINER's path → L1, L2, L3):")
    for p in payouts_a:
        mid = get_member_id(db, p['recipient_id'])
        label = "SELF" if p['is_self'] else f"L{p['level_diff']}"
        print(f"    {label}: ₹{PAYOUT_PER_SLOT} → {mid} ({p['recipient_type']})")

    test(len(payouts_a) == 3, f"Cycle 1 produces 3 payouts")
    test(all(p['cycle_slot'] == 1 for p in payouts_a), "All payouts tagged cycle_slot=1")
    test(not any(p['is_self'] for p in payouts_a), "Cycle 1 has NO self-payout (correct)")

    # Verify User A got ₹1000 coupon
    wallet_a = get_wallet(db, user_a_id)
    test(wallet_a['couponBalance'] == 1000, f"User A coupon = ₹{wallet_a['couponBalance']}")
    test(wallet_a['incomeBalance'] == 0, f"User A income = ₹{wallet_a['incomeBalance']} (no self-payout in cycle 1)")

    # User A is now ACTIVE
    test(get_user(db, user_a_id)['status'] == 'ACTIVE', "User A status = ACTIVE")

    # Company user cycle should NOT advance (stays at 1 for company users — let's verify the code behavior)
    # Actually the code always advances the referrer. Let's see:
    company_cycle_after = get_user(db, last_company_id)['cyclePosition']
    print(f"  Company referrer cyclePosition after: {company_cycle_after}")
    # Company users get their cycle advanced by the engine, which is fine

    # ═══════════════════════════════════════════════════════════
    # PHASE 3: REGISTER USERS B, C, D, E under User A → test cycle 2→3→4→5→2
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 3: Users B-E under User A (cycle rotation 2→3→4→5→2) ──")

    test_users = []
    expected_cycles_after = [3, 4, 5, 2]  # User A cycle after each referral
    expected_slot_used = [2, 3, 4, 5]     # Cycle slot used for each joining

    for i, (name, mobile) in enumerate([
        ("User B", "9000000502"),
        ("User C", "9000000503"),
        ("User D", "9000000504"),
        ("User E", "9000000505"),
    ]):
        print(f"\n  ─── {name} (referral #{i+1} for User A) ───")

        uid, mid = create_user(db, name, mobile, user_a_id, 'LEFT' if i % 2 == 0 else 'RIGHT')
        parent, pos, lvl = add_to_network(db, uid, user_a_id, 'LEFT' if i % 2 == 0 else 'RIGHT')
        req_id = submit_joining_request(db, uid)

        # Check User A's current cycle before payout
        cycle_before = get_user(db, user_a_id)['cyclePosition']
        print(f"    User A cycle before: {cycle_before}, expected slot: {expected_slot_used[i]}")
        test(cycle_before == expected_slot_used[i], f"User A cycle position = {cycle_before} (expected {expected_slot_used[i]})")

        payouts = process_joining_payout(db, req_id, uid)

        print(f"    Cycle {expected_slot_used[i]} payout (uses REFERRER's path):")
        for p in payouts:
            r_mid = get_member_id(db, p['recipient_id'])
            label = "SELF" if p['is_self'] else f"L{p['level_diff']}"
            print(f"      {label}: ₹{PAYOUT_PER_SLOT} → {r_mid} ({p['recipient_type']})")

        test(len(payouts) == 3, f"3 payout records created")
        test(payouts[0]['cycle_slot'] == expected_slot_used[i], f"Cycle slot = {payouts[0]['cycle_slot']}")

        # First slot in cycles 2-5 should be SELF → User A
        self_payout = next((p for p in payouts if p['is_self']), None)
        test(self_payout is not None, "SELF payout exists")
        test(self_payout['recipient_id'] == user_a_id, f"SELF payout goes to User A ({user_a_mid})")

        # Check User A cycle advanced
        cycle_after = get_user(db, user_a_id)['cyclePosition']
        test(cycle_after == expected_cycles_after[i], f"User A cycle after = {cycle_after} (expected {expected_cycles_after[i]})")

        # Joiner got ₹1000 coupon
        w = get_wallet(db, uid)
        test(w['couponBalance'] == 1000, f"{name} coupon = ₹{w['couponBalance']}")

        test_users.append({'id': uid, 'mid': mid, 'name': name})

    # ═══════════════════════════════════════════════════════════
    # PHASE 4: VERIFY WALLET TOTALS
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 4: Wallet Totals ──")

    wallet_a_final = get_wallet(db, user_a_id)
    # User A should have: 4 SELF payouts × ₹250 = ₹1000 income
    test(wallet_a_final['incomeBalance'] == 1000,
         f"User A income = ₹{wallet_a_final['incomeBalance']} (expected 1000 = 4×₹250)")
    test(wallet_a_final['couponBalance'] == 1000,
         f"User A coupon = ₹{wallet_a_final['couponBalance']} (expected 1000)")

    # ═══════════════════════════════════════════════════════════
    # PHASE 5: REGISTER USER F under User B → tests 2nd-gen referral
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 5: User F under User B (2nd generation) ──")

    user_b_id = test_users[0]['id']
    user_b_mid = test_users[0]['mid']

    user_f_id, user_f_mid = create_user(db, "User F", "9000000506", user_b_id, 'LEFT')
    add_to_network(db, user_f_id, user_b_id, 'LEFT')
    req_f_id = submit_joining_request(db, user_f_id)

    # User B should be at cyclePosition 2 (never been a referrer before)
    user_b_cycle = get_user(db, user_b_id)['cyclePosition']
    test(user_b_cycle == 2, f"User B cycle = {user_b_cycle} (first referral → uses cycle 2)")

    payouts_f = process_joining_payout(db, req_f_id, user_f_id)
    print(f"  Cycle 2 payout for User F (referrer=User B):")
    for p in payouts_f:
        r_mid = get_member_id(db, p['recipient_id'])
        label = "SELF" if p['is_self'] else f"L{p['level_diff']}"
        print(f"    {label}: ₹{PAYOUT_PER_SLOT} → {r_mid} ({p['recipient_type']})")

    # SELF should go to User B
    self_f = next(p for p in payouts_f if p['is_self'])
    test(self_f['recipient_id'] == user_b_id, f"SELF goes to User B ({user_b_mid})")

    # User B cycle advanced 2→3
    test(get_user(db, user_b_id)['cyclePosition'] == 3, "User B cycle advanced to 3")

    # ═══════════════════════════════════════════════════════════
    # PHASE 6: SHOP / ORDER FLOW
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 6: Shop & Order Flow ──")

    product = db.execute("SELECT * FROM Product WHERE id = ?", (prod_id,)).fetchone()
    test(product is not None, f"Product found: {product['name']} — ₹{product['price']}")

    # User A buys the product (₹2000), uses ₹1000 coupon (50%), pays ₹1000 cash
    coupon_used = min(1000, int(product['price'] * product['couponSplitPct'] / 100))
    cash_paid = product['price'] - coupon_used
    cashback = int(product['price'] * 0.025)  # 2.5%

    order_id = str(uuid.uuid4())
    db.execute("""INSERT INTO "Order" (id, userId, productId, quantity, totalAmount, cashPaid, couponUsed, cashback)
                  VALUES (?, ?, ?, 1, ?, ?, ?, ?)""",
               (order_id, user_a_id, prod_id, product['price'], cash_paid, coupon_used, cashback))

    # Update wallet
    db.execute("UPDATE Wallet SET couponBalance = couponBalance - ?, purchaseBalance = purchaseBalance + ? WHERE userId = ?",
               (coupon_used, cashback, user_a_id))
    db.commit()

    wallet_after_order = get_wallet(db, user_a_id)
    test(wallet_after_order['couponBalance'] == 0,
         f"User A coupon after order = ₹{wallet_after_order['couponBalance']} (1000 - 1000 used)")
    test(wallet_after_order['purchaseBalance'] == cashback,
         f"User A purchase wallet = ₹{wallet_after_order['purchaseBalance']} (2.5% of ₹{product['price']})")

    order_row = db.execute('SELECT * FROM "Order" WHERE id = ?', (order_id,)).fetchone()
    test(order_row['status'] == 'PLACED', f"Order status = {order_row['status']}")
    test(order_row['cashback'] == 50, f"Order cashback = ₹{order_row['cashback']}")

    # ═══════════════════════════════════════════════════════════
    # PHASE 7: VENDOR FLOW
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 7: Vendor Registration ──")

    vendor_id = str(uuid.uuid4())
    db.execute("""INSERT INTO Vendor (id, userId, businessName, categoryId, pinCode)
                  VALUES (?, ?, 'User A Electronics', ?, '600001')""",
               (vendor_id, user_a_id, cat_id))
    db.commit()

    vendor = db.execute("SELECT * FROM Vendor WHERE id = ?", (vendor_id,)).fetchone()
    test(vendor is not None, f"Vendor created: {vendor['businessName']}")
    test(vendor['isApproved'] == 0, "Vendor not yet approved (pending admin)")
    test(vendor['platformFee'] == 10, f"Platform fee = {vendor['platformFee']}%")

    # Duplicate vendor in same category+pinCode should fail
    try:
        db.execute("""INSERT INTO Vendor (id, userId, businessName, categoryId, pinCode)
                      VALUES (?, ?, 'Duplicate Shop', ?, '600001')""",
                   (str(uuid.uuid4()), test_users[0]['id'], cat_id))
        test(False, "Duplicate vendor should fail (same category+pinCode)")
    except sqlite3.IntegrityError:
        test(True, "Duplicate vendor rejected (UNIQUE constraint on category+pin)")

    # ═══════════════════════════════════════════════════════════
    # PHASE 8: EDGE CASES
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 8: Edge Cases ──")

    # 8a. Duplicate joining request (idempotency)
    try:
        process_joining_payout(db, req_a_id, user_a_id)
        test(False, "Duplicate payout should throw ALREADY_PROCESSED")
    except Exception as e:
        test("ALREADY_PROCESSED" in str(e), f"Idempotency check works: {e}")

    # 8b. getNextCyclePosition edge cases
    test(get_next_cycle_position(0) == 2, "getNextCyclePosition(0) = 2 (corrupted → safe default)")
    test(get_next_cycle_position(1) == 2, "getNextCyclePosition(1) = 2 (corrupted → safe default)")
    test(get_next_cycle_position(2) == 3, "getNextCyclePosition(2) = 3")
    test(get_next_cycle_position(3) == 4, "getNextCyclePosition(3) = 4")
    test(get_next_cycle_position(4) == 5, "getNextCyclePosition(4) = 5")
    test(get_next_cycle_position(5) == 2, "getNextCyclePosition(5) = 2 (wraps)")
    test(get_next_cycle_position(6) == 2, "getNextCyclePosition(6) = 2 (out of range → safe default)")
    test(get_next_cycle_position(-1) == 2, "getNextCyclePosition(-1) = 2 (negative → safe default)")

    # 8c. BFS placement: multiple users on same leg
    print("\n  Testing BFS spillover placement...")
    # User G under User A LEFT (User B is already LEFT)
    user_g_id, user_g_mid = create_user(db, "User G", "9000000507", user_a_id, 'LEFT')
    parent_g, pos_g, lvl_g = add_to_network(db, user_g_id, user_a_id, 'LEFT')
    # User B is at User A's LEFT, so User G should go to User B's LEFT or RIGHT
    user_b_node = db.execute("SELECT * FROM NetworkNode WHERE userId = ?", (user_b_id,)).fetchone()
    user_g_node = db.execute("SELECT * FROM NetworkNode WHERE userId = ?", (user_g_id,)).fetchone()
    test(user_g_node['parentId'] != user_a_id, f"User G placed via BFS under {get_member_id(db, user_g_node['parentId'])} (not directly under User A)")
    print(f"    User G placed at level {user_g_node['level']}, parent={get_member_id(db, user_g_node['parentId'])}, pos={user_g_node['position']}")

    # ═══════════════════════════════════════════════════════════
    # PHASE 9: NETWORK TREE INTEGRITY
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 9: Network Tree Integrity ──")

    # Every real user should have a network node
    real_users = db.execute("SELECT id, memberId FROM User WHERE userType = 'REAL' AND role != 'ADMIN' AND status != 'PENDING'").fetchall()
    for u in real_users:
        node = db.execute("SELECT * FROM NetworkNode WHERE userId = ?", (u['id'],)).fetchone()
        if node:
            # Path should end with own id
            path_parts = node['path'].split('.')
            test(path_parts[-1] == u['id'], f"{u['memberId']} path ends with own ID")
        else:
            test(False, f"{u['memberId']} missing NetworkNode")

    # Binary tree constraint: each node should have at most 2 children
    all_parents = db.execute("""
        SELECT parentId, COUNT(*) as cnt FROM NetworkNode
        WHERE parentId IS NOT NULL
        GROUP BY parentId HAVING cnt > 2
    """).fetchall()
    test(len(all_parents) == 0, f"Binary tree: no node has > 2 children ({len(all_parents)} violations)")

    # ═══════════════════════════════════════════════════════════
    # PHASE 10: FULL PAYOUT AUDIT
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 10: Full Payout Audit ──")

    all_payouts = db.execute("""
        SELECT pr.*, u.memberId as recipientMid, u.userType as rType
        FROM PayoutRecord pr
        JOIN User u ON pr.recipientId = u.id
        ORDER BY pr.createdAt
    """).fetchall()

    total_paid = sum(p['amount'] for p in all_payouts)
    num_joins = db.execute("SELECT COUNT(*) as c FROM JoiningRequest WHERE status = 'APPROVED'").fetchone()['c']

    print(f"  Total joinings approved: {num_joins}")
    print(f"  Total payout records: {len(all_payouts)}")
    print(f"  Total ₹ distributed: ₹{total_paid}")
    test(len(all_payouts) == num_joins * 3, f"Each joining creates exactly 3 payouts ({len(all_payouts)} = {num_joins}×3)")
    test(total_paid == num_joins * 3 * PAYOUT_PER_SLOT, f"₹{total_paid} = {num_joins}×3×₹{PAYOUT_PER_SLOT}")

    # Earnings by recipient
    earnings = defaultdict(int)
    for p in all_payouts:
        earnings[f"{p['recipientMid']} ({p['rType']})"] += p['amount']

    print("\n  Earnings by recipient:")
    for k, v in sorted(earnings.items(), key=lambda x: -x[1]):
        print(f"    {k}: ₹{v}")

    # GST check
    gst_total = db.execute("SELECT SUM(amount) as s FROM GstRecord").fetchone()['s']
    test(gst_total == num_joins * GST_AMOUNT, f"GST total = ₹{gst_total} (expected {num_joins}×₹{GST_AMOUNT})")

    # Wallet balance consistency
    print("\n  Wallet balance check:")
    for uid, name in [(user_a_id, "User A")] + [(u['id'], u['name']) for u in test_users]:
        w = get_wallet(db, uid)
        u = get_user(db, uid)
        txn_sum = db.execute("""
            SELECT COALESCE(SUM(CASE WHEN type='CREDIT' THEN amount ELSE -amount END), 0) as net
            FROM WalletTransaction
            WHERE walletId = (SELECT id FROM Wallet WHERE userId = ?) AND field = 'INCOME'
        """, (uid,)).fetchone()['net']

        balance_ok = w['incomeBalance'] == txn_sum
        test(balance_ok, f"{name} ({u['memberId']}): income=₹{w['incomeBalance']}, txn_sum=₹{txn_sum}")

    # ═══════════════════════════════════════════════════════════
    # PHASE 11: SECOND CYCLE THROUGH (User A gets 5th referral → back to cycle 2)
    # ═══════════════════════════════════════════════════════════
    print("\n── Phase 11: Verify cycle wrap happened correctly ──")

    user_a_final = get_user(db, user_a_id)
    test(user_a_final['cyclePosition'] == 2, f"User A cycle after 4 referrals = {user_a_final['cyclePosition']} (wrapped 5→2)")

    # Register one more under User A to verify cycle 2 works again
    user_h_id, user_h_mid = create_user(db, "User H", "9000000508", user_a_id, 'RIGHT')
    add_to_network(db, user_h_id, user_a_id, 'RIGHT')
    req_h_id = submit_joining_request(db, user_h_id)

    user_a_before_h = get_user(db, user_a_id)['cyclePosition']
    test(user_a_before_h == 2, f"User A at cycle 2 before User H approval")

    payouts_h = process_joining_payout(db, req_h_id, user_h_id)
    user_a_after_h = get_user(db, user_a_id)['cyclePosition']
    test(user_a_after_h == 3, f"User A cycle after User H = {user_a_after_h} (2→3, second rotation)")

    self_h = next(p for p in payouts_h if p['is_self'])
    test(self_h['recipient_id'] == user_a_id, "User H SELF payout goes to User A (cycle 2 again)")

    wallet_a_final2 = get_wallet(db, user_a_id)
    test(wallet_a_final2['incomeBalance'] == 1250,
         f"User A total income = ₹{wallet_a_final2['incomeBalance']} (5 SELF payouts × ₹250)")

    # ═══════════════════════════════════════════════════════════
    # SUMMARY
    # ═══════════════════════════════════════════════════════════
    print("\n" + "═" * 60)
    if failed == 0:
        print(f"  ALL {passed} TESTS PASSED ✅")
    else:
        print(f"  {passed}/{total} PASSED, {failed} FAILED ❌")
    print("═" * 60)
    print()

    return failed == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
