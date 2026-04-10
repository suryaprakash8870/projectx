# PROJECT_SPEC.md — Plan-I (₹1000) MLM Network Platform (Prototype)

> Paste this file into Google Antigravity's Agent Manager and say:
> **"Read PROJECT_SPEC.md and implement this project step by step in Plan mode."**

---

## 1. Project Overview

| Field             | Value                                                                  |
|-------------------|------------------------------------------------------------------------|
| Project Name      | Plan-I Network Platform (Prototype)                                    |
| Type              | Full-Stack Responsive Web App (MLM / Network Plan)                     |
| Mode              | Prototype — no real payments, no mobile app                            |
| Joining Fee       | ₹1,000 (simulated — admin manually approves payment)                   |
| Payout Formula    | d-1, d-4, d-5 (3 upline levels earn ₹250 each)                        |
| Network Depth     | 9 upline levels + 9 downline levels per member                         |
| Amount Split      | ₹750 → Uplines · ₹180 → GST · ₹70 → Company                          |
| Platform          | Responsive Web Only (desktop sidebar + mobile bottom tab bar)          |
| Payment           | Manual — admin approves joining via dashboard                          |
| Member ID Format  | `IND` + 6-digit zero-padded number (e.g. IND000001, IND000501)        |
| Pre-seeded Users  | IND000001 – IND000500 → Company Users (500 users, pre-built network)  |
| Real Users Start  | IND000501 onwards → Actual members who register                        |

---

## 2. Member ID System

### 2.1 ID Format

Every user in the system — company or real — gets a unique human-readable member ID:

```
IND000001   ← first company user (root of network)
IND000002   ← second company user
...
IND000500   ← last company user
IND000501   ← first real (actual) user to register
IND000502   ← second real user
...
```

The ID is generated sequentially and stored as a unique field on the `users` table.
Auto-increment is handled by the server: on each new registration, query `MAX(sequenceNumber)` and add 1.

### 2.2 Company Users vs Real Users

| Range             | Type           | Purpose                                                        |
|-------------------|----------------|----------------------------------------------------------------|
| IND000001–IND000500 | Company Users | Pre-seeded by admin to fill the network tree upline positions. They have wallets but do NOT log in. Their income wallet receives payouts when a real user's d-1/d-4/d-5 resolves to them. This is company-controlled income. |
| IND000501+        | Real Users     | Actual members who register, log in, view dashboards, buy products, and refer others. |

### 2.3 The 9-Level Upline Combination Rule

The network tree is pre-built with 500 company users in a structured chain.
When the **first real user (IND000501)** joins and is placed in the tree:

- Their **upline ancestors** for positions d-1, d-4, d-5 will be **company users**.
- The ₹250 payout for each slot still fires — it credits the **company user's income wallet** (which is company-controlled revenue).
- As more real users join deeper in the tree, their d-1/d-4/d-5 ancestors gradually become **real users** who then earn the ₹250 genuinely.

**The payout logic itself never changes** — it always pays d-1, d-4, d-5 regardless of whether the recipient is a company user or a real user. The distinction is only for display and reporting purposes.

### 2.4 When Does "Real Referral Logic" Start?

The referral/earning cycle becomes meaningful for real users when:
- A real user (e.g. IND000501) refers another real user (IND000502)
- IND000501 is at d-1 relative to IND000502 → IND000501 earns ₹250 genuinely
- As the chain of real users deepens past 4 and 5 levels, d-4 and d-5 slots also resolve to real users

Until that depth is reached, those earlier slots still pay — just to company user wallets.

---

## 3. Tech Stack

### Frontend (Responsive Web)
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (mobile-first, fully responsive)
- **State:** Redux Toolkit + RTK Query
- **Routing:** React Router v6
- **Charts / Tree:** D3.js (network tree visualisation)
- **Notifications:** React Hot Toast (in-app only)
- **QR Code:** `react-qr-code`

### Backend
- **Runtime:** Node.js 20 + Express.js (TypeScript)
- **Architecture:** Single Express monolith (prototype)
- **Auth:** JWT access + refresh tokens · Mock OTP (always `123456`)
- **Queue:** None — payouts run synchronously on admin approval

### Database
- **Primary:** SQLite (local prototype) → PostgreSQL (production)
- **ORM:** Prisma

### No Third-Party Integrations
- No Razorpay, No SMS, No FCM, No KYC, No email service

---

## 4. Project Structure

```
plan-i-prototype/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── store/
│   │   ├── hooks/
│   │   └── utils/
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── routes/         # auth, users, network, joining, wallet, products, orders, admin
│   │   ├── middleware/     # jwtAuth, requireAdmin, errorHandler
│   │   ├── services/       # payoutEngine, networkService, walletService, memberIdService
│   │   ├── prisma/         # schema.prisma, seed.ts
│   │   └── index.ts
│   └── tsconfig.json
│
├── .env.example
├── package.json            # root — concurrently runs client + server
└── README.md
```

---

## 5. Database Schema (Prisma)

```prisma
// server/src/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── Users ────────────────────────────────────────────────────────────────────

model User {
  id               String     @id @default(uuid())    // internal UUID (foreign keys)
  memberId         String     @unique                  // IND000001, IND000501, etc.
  sequenceNumber   Int        @unique                  // 1, 2, ... 500, 501, 502 ...
  userType         UserType   @default(REAL)           // COMPANY | REAL
  name             String
  mobile           String?    @unique                  // NULL for company users
  email            String?    @unique                  // NULL for company users
  passwordHash     String?                             // NULL for company users
  referrerId       String?                             // UUID of referrer user
  level            Int        @default(1)
  role             Role       @default(MEMBER)
  status           UserStatus @default(ACTIVE)         // company users always ACTIVE
  createdAt        DateTime   @default(now())

  referrer         User?            @relation("Referrals", fields: [referrerId], references: [id])
  referrals        User[]           @relation("Referrals")
  wallet           Wallet?
  orders           Order[]
  payoutsReceived  PayoutRecord[]   @relation("Recipient")
  joiningRequests  JoiningRequest[]
  networkNode      NetworkNode?
}

enum UserType   { COMPANY REAL }
enum Role       { MEMBER ADMIN }
enum UserStatus { PENDING ACTIVE SUSPENDED }

// ─── Member ID Sequence ───────────────────────────────────────────────────────

model MemberSequence {
  id             Int @id @default(1)
  lastSequence   Int @default(500)   // starts at 500 (company users pre-filled)
}

// ─── Joining Requests ─────────────────────────────────────────────────────────

model JoiningRequest {
  id          String               @id @default(uuid())
  userId      String               @unique
  amount      Int                  @default(1000)
  status      JoiningRequestStatus @default(PENDING)
  note        String?
  approvedAt  DateTime?
  createdAt   DateTime             @default(now())

  user        User                 @relation(fields: [userId], references: [id])
}

enum JoiningRequestStatus { PENDING APPROVED REJECTED }

// ─── Network Nodes ────────────────────────────────────────────────────────────

model NetworkNode {
  userId     String  @id
  parentId   String?
  level      Int     @default(1)
  path       String  // dot-separated UUIDs: "rootUUID.parentUUID.userUUID"

  user       User    @relation(fields: [userId], references: [id])
}

// ─── Wallets ──────────────────────────────────────────────────────────────────

model Wallet {
  id              String   @id @default(uuid())
  userId          String   @unique
  couponBalance   Int      @default(0)
  incomeBalance   Int      @default(0)
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
  transactions    WalletTransaction[]
}

model WalletTransaction {
  id          String      @id @default(uuid())
  walletId    String
  type        TxType
  field       WalletField
  amount      Int
  note        String?
  sourceRef   String?
  createdAt   DateTime    @default(now())

  wallet      Wallet      @relation(fields: [walletId], references: [id])
}

enum TxType      { CREDIT DEBIT }
enum WalletField { COUPON INCOME }

// ─── Payout Records ───────────────────────────────────────────────────────────

model PayoutRecord {
  id              String   @id @default(uuid())
  requestId       String
  joinerId        String
  recipientId     String
  recipientType   UserType // COMPANY | REAL — for reporting
  levelDiff       Int      // 1=d-1, 4=d-4, 5=d-5
  amount          Int      @default(250)
  createdAt       DateTime @default(now())

  recipient       User     @relation("Recipient", fields: [recipientId], references: [id])
}

// ─── GST Ledger ───────────────────────────────────────────────────────────────

model GstRecord {
  id        String   @id @default(uuid())
  requestId String   @unique
  amount    Int      @default(180)
  createdAt DateTime @default(now())
}

// ─── Products & Orders ────────────────────────────────────────────────────────

model Product {
  id             String  @id @default(uuid())
  name           String
  description    String?
  price          Int
  couponSplitPct Int     @default(50)
  imageUrl       String?
  isActive       Boolean @default(true)
  orders         Order[]
}

model Order {
  id          String      @id @default(uuid())
  userId      String
  productId   String
  quantity    Int         @default(1)
  totalAmount Int
  cashPaid    Int
  couponUsed  Int
  status      OrderStatus @default(PLACED)
  placedAt    DateTime    @default(now())

  user        User        @relation(fields: [userId], references: [id])
  product     Product     @relation(fields: [productId], references: [id])
}

enum OrderStatus { PLACED PROCESSING SHIPPED DELIVERED CANCELLED }
```

---

## 6. Member ID Service

```typescript
// server/src/services/memberIdService.ts

/**
 * Generates the next sequential member ID.
 * Company users:  IND000001 – IND000500  (seeded, never called at runtime)
 * Real users:     IND000501, IND000502, ... (called on each new registration)
 */
export async function generateNextMemberId(db: PrismaClient): Promise<{ memberId: string; sequenceNumber: number }> {
  // Atomic increment using a single-row sequence table
  const seq = await db.memberSequence.update({
    where: { id: 1 },
    data: { lastSequence: { increment: 1 } }
  });
  const memberId = `IND${String(seq.lastSequence).padStart(6, '0')}`;
  return { memberId, sequenceNumber: seq.lastSequence };
}

/**
 * Returns true if a memberId belongs to a pre-seeded company user.
 */
export function isCompanyUser(sequenceNumber: number): boolean {
  return sequenceNumber >= 1 && sequenceNumber <= 500;
}
```

---

## 7. Network Seed Strategy (500 Company Users)

### 7.1 Tree Structure for 500 Company Users

The 500 company users are arranged in a **linear chain** (single path), so every new real user
placed after them has a guaranteed 9-level upline filled with company users for the first several real joiners.

```
IND000001 (Level 1) — root
  └─ IND000002 (Level 2)
       └─ IND000003 (Level 3)
            └─ ...
                 └─ IND000500 (Level 500)
                      └─ IND000501 (Level 501) ← first real user
                           └─ IND000502 (Level 502) ← second real user
```

This means:
- IND000501's d-1=IND000500 (company), d-4=IND000497 (company), d-5=IND000496 (company) → ₹750 to company wallets
- IND000502's d-1=IND000501 (real ✅), d-4=IND000498 (company), d-5=IND000497 (company) → ₹250 to real user, ₹500 to company
- From IND000505 onwards: d-1, d-4, d-5 can all be real users → full ₹750 to real users

### 7.2 Payout Recipient Classification

When the payout engine resolves recipients, it records `recipientType` (COMPANY or REAL):

| Recipient Type | Effect                                                              |
|----------------|---------------------------------------------------------------------|
| REAL user      | ₹250 credited to their personal Income Wallet — they can see it   |
| COMPANY user   | ₹250 credited to company user's Income Wallet — counted as company revenue in admin reports |

The payout logic code is **identical** for both — no special casing needed.
The admin report separates totals by `recipientType` for transparency.

---

## 8. Core Business Logic

### 8.1 Payout Engine

```typescript
// server/src/services/payoutEngine.ts

export const PAYOUT_PER_SLOT = 250;
export const GST_AMOUNT      = 180;
export const COMPANY_FEE     = 70;
export const JOIN_FEE        = 1000;

/**
 * d-1, d-4, d-5 formula.
 * Returns offsets where joinerLevel - offset >= 1.
 */
export function getPayoutOffsets(joinerLevel: number): number[] {
  return [1, 4, 5].filter(offset => joinerLevel - offset >= 1);
}

export async function processJoiningPayout(
  requestId: string,
  joinerId: string,
  db: PrismaClient
) {
  // 1. Idempotency check
  const existing = await db.payoutRecord.findFirst({ where: { requestId } });
  if (existing) throw new Error('ALREADY_PROCESSED');

  // 2. Joiner's network node
  const node = await db.networkNode.findUniqueOrThrow({ where: { userId: joinerId } });
  const pathParts = node.path.split('.');

  // 3. Resolve qualifying ancestor userIds from path
  const offsets = getPayoutOffsets(node.level);
  const ancestors = offsets.map(offset => ({
    userId: pathParts[pathParts.length - 1 - offset],
    levelDiff: offset
  })).filter(a => Boolean(a.userId));

  // 4. Atomic transaction
  await db.$transaction(async (tx) => {

    for (const ancestor of ancestors) {
      // Determine if this ancestor is a company or real user
      const ancestorUser = await tx.user.findUniqueOrThrow({
        where: { id: ancestor.userId },
        select: { userType: true }
      });

      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: ancestor.userId } });

      await tx.wallet.update({
        where: { userId: ancestor.userId },
        data: { incomeBalance: { increment: PAYOUT_PER_SLOT } }
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          field: 'INCOME',
          amount: PAYOUT_PER_SLOT,
          note: `Joining bonus from ${node.level > 500 ? 'real' : 'company'} joiner (d-${ancestor.levelDiff})`,
          sourceRef: requestId
        }
      });

      // Record payout with recipientType for admin reporting
      await tx.payoutRecord.create({
        data: {
          requestId,
          joinerId,
          recipientId: ancestor.userId,
          recipientType: ancestorUser.userType,  // COMPANY or REAL
          levelDiff: ancestor.levelDiff,
          amount: PAYOUT_PER_SLOT
        }
      });
    }

    // Credit ₹1000 coupon to joiner
    const joinerWallet = await tx.wallet.findUniqueOrThrow({ where: { userId: joinerId } });
    await tx.wallet.update({
      where: { userId: joinerId },
      data: { couponBalance: { increment: JOIN_FEE } }
    });
    await tx.walletTransaction.create({
      data: {
        walletId: joinerWallet.id, type: 'CREDIT', field: 'COUPON',
        amount: JOIN_FEE, note: 'Joining coupon credit', sourceRef: requestId
      }
    });

    // Record GST + activate user + mark request approved
    await tx.gstRecord.create({ data: { requestId, amount: GST_AMOUNT } });
    await tx.user.update({ where: { id: joinerId }, data: { status: 'ACTIVE' } });
    await tx.joiningRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', approvedAt: new Date() }
    });
  });
}
```

### 8.2 Network Service

```typescript
// server/src/services/networkService.ts

/**
 * Called when a new REAL user verifies their OTP and their joining request is pending approval.
 * Adds the user to the network tree under their referrer.
 * If referrerId is null, place under the last company user (IND000500).
 */
export async function addToNetwork(userId: string, referrerId: string | null, db: PrismaClient) {
  // Default parent: last company user (IND000500) if no referrer given
  const effectiveReferrerId = referrerId ?? await getLastCompanyUserId(db);

  const parentNode = await db.networkNode.findUniqueOrThrow({ where: { userId: effectiveReferrerId } });

  await db.networkNode.create({
    data: {
      userId,
      parentId: effectiveReferrerId,
      level: parentNode.level + 1,
      path: `${parentNode.path}.${userId}`
    }
  });
}

async function getLastCompanyUserId(db: PrismaClient): Promise<string> {
  const user = await db.user.findFirstOrThrow({
    where: { userType: 'COMPANY' },
    orderBy: { sequenceNumber: 'desc' },
    select: { id: true }
  });
  return user.id;
}

export async function getUplineChain(userId: string, db: PrismaClient) {
  const node = await db.networkNode.findUniqueOrThrow({ where: { userId } });
  const ancestorIds = node.path.split('.').slice(0, -1);
  const users = await db.user.findMany({
    where: { id: { in: ancestorIds } },
    select: { id: true, memberId: true, name: true, userType: true, level: true }
  });
  return ancestorIds.map(id => users.find(u => u.id === id)).filter(Boolean);
}

export async function getDownlineTree(userId: string, db: PrismaClient) {
  const node = await db.networkNode.findUniqueOrThrow({ where: { userId } });
  return db.networkNode.findMany({
    where: { path: { startsWith: `${node.path}.` } },
    include: {
      user: { select: { id: true, memberId: true, name: true, userType: true, status: true, level: true } }
    }
  });
}
```

### 8.3 Registration Service

```typescript
// server/src/routes/auth.ts  (registration handler)

async function registerUser(body: RegisterDto, db: PrismaClient) {
  // 1. Validate referral code if provided (must be a valid memberId of an ACTIVE user)
  let referrer: User | null = null;
  if (body.referralCode) {
    referrer = await db.user.findFirst({
      where: { memberId: body.referralCode, status: 'ACTIVE' }
    });
    if (!referrer) throw new Error('INVALID_REFERRAL_CODE');
  }

  // 2. Generate next member ID (IND000501, IND000502, ...)
  const { memberId, sequenceNumber } = await generateNextMemberId(db);

  // 3. Create user
  const user = await db.user.create({
    data: {
      memberId,
      sequenceNumber,
      userType: 'REAL',
      name: body.name,
      mobile: body.mobile,
      email: body.email,
      passwordHash: await bcrypt.hash(body.password, 10),
      referrerId: referrer?.id ?? null,
      level: 0,        // set properly when added to network on OTP verify
      status: 'PENDING'
    }
  });

  // 4. Create wallet (empty until joining request approved)
  await db.wallet.create({ data: { userId: user.id } });

  return { userId: user.id, memberId };
}
```

### 8.4 Product Purchase

```typescript
// server/src/services/walletService.ts

export async function purchaseProduct(userId: string, productId: string, qty: number, db: PrismaClient) {
  const product    = await db.product.findUniqueOrThrow({ where: { id: productId } });
  const total      = product.price * qty;
  const couponPart = Math.floor(total * product.couponSplitPct / 100);
  const cashPart   = total - couponPart;

  const wallet = await db.wallet.findUniqueOrThrow({ where: { userId } });
  if (wallet.couponBalance < couponPart) throw new Error('INSUFFICIENT_COUPON');
  if (wallet.incomeBalance < cashPart)   throw new Error('INSUFFICIENT_INCOME');

  await db.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId },
      data: { couponBalance: { decrement: couponPart }, incomeBalance: { decrement: cashPart } }
    });
    const order = await tx.order.create({
      data: { userId, productId, quantity: qty, totalAmount: total, cashPaid: cashPart, couponUsed: couponPart }
    });
    await tx.walletTransaction.createMany({
      data: [
        { walletId: wallet.id, type: 'DEBIT', field: 'COUPON', amount: couponPart, note: `Purchase: ${product.name}`, sourceRef: order.id },
        { walletId: wallet.id, type: 'DEBIT', field: 'INCOME', amount: cashPart,   note: `Purchase: ${product.name}`, sourceRef: order.id }
      ]
    });
  });
}
```

---

## 9. Seed Data (`server/src/prisma/seed.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('Seeding 500 company users (IND000001–IND000500)...');

  // ── Step 1: Initialise sequence table ──────────────────────────────────────
  await db.memberSequence.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastSequence: 500 }   // next real user will be 501
  });

  // ── Step 2: Create 500 company users in a linear chain ────────────────────
  let previousUserId: string | null = null;
  let previousPath: string = '';

  for (let i = 1; i <= 500; i++) {
    const memberId = `IND${String(i).padStart(6, '0')}`;

    const user = await db.user.create({
      data: {
        memberId,
        sequenceNumber: i,
        userType: 'COMPANY',
        name: `Company Node ${memberId}`,
        mobile: null,
        email: null,
        passwordHash: null,
        referrerId: previousUserId,
        level: i,
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });

    const path = previousPath ? `${previousPath}.${user.id}` : user.id;

    await db.networkNode.create({
      data: {
        userId: user.id,
        parentId: previousUserId,
        level: i,
        path
      }
    });

    await db.wallet.create({
      data: { userId: user.id, couponBalance: 0, incomeBalance: 0 }
    });

    previousUserId = user.id;
    previousPath = path;

    if (i % 50 === 0) console.log(`  Created ${i}/500 company users...`);
  }

  // ── Step 3: Admin user (not in network tree) ───────────────────────────────
  await db.user.create({
    data: {
      memberId: 'ADMIN001',
      sequenceNumber: 0,
      userType: 'REAL',
      name: 'Admin',
      mobile: '9999999999',
      email: 'admin@planone.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      status: 'ACTIVE',
      level: 0
    }
  });

  // ── Step 4: 10 Demo real users (IND000501–IND000510) for testing ───────────
  // These are placed sequentially after IND000500 in the chain
  // This lets us test: IND000505 joining → d-1=IND000504(real), d-4=IND000501(real), d-5=IND000500(company)
  const ind500Node = await db.networkNode.findFirstOrThrow({
    where: { user: { memberId: 'IND000500' } }
  });

  let prevRealUserId = ind500Node.userId;
  let prevRealPath   = ind500Node.path;

  for (let i = 501; i <= 510; i++) {
    const memberId = `IND${String(i).padStart(6, '0')}`;
    await db.memberSequence.update({ where: { id: 1 }, data: { lastSequence: i } });

    const user = await db.user.create({
      data: {
        memberId,
        sequenceNumber: i,
        userType: 'REAL',
        name: `Demo Member ${memberId}`,
        mobile: `90000${String(i).slice(-5)}`,
        email: `${memberId.toLowerCase()}@demo.com`,
        passwordHash: await bcrypt.hash('member123', 10),
        referrerId: prevRealUserId,
        level: 500 + (i - 500),
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });

    const path = `${prevRealPath}.${user.id}`;
    await db.networkNode.create({
      data: { userId: user.id, parentId: prevRealUserId, level: 500 + (i - 500), path }
    });
    await db.wallet.create({
      data: { userId: user.id, couponBalance: 1000, incomeBalance: i >= 505 ? 250 : 0 }
    });

    prevRealUserId = user.id;
    prevRealPath   = path;
  }

  // ── Step 5: Demo products ──────────────────────────────────────────────────
  await db.product.createMany({
    data: [
      { name: 'Herbal Soap',  description: 'Natural bath soap 100g',    price: 100, couponSplitPct: 50 },
      { name: 'Neem Shampoo', description: 'Natural shampoo 200ml',     price: 200, couponSplitPct: 50 },
      { name: 'Face Wash',    description: 'Neem face wash 100ml',      price: 150, couponSplitPct: 50 }
    ]
  });

  console.log('\n✅ Seed complete!');
  console.log('   Admin login  : mobile=9999999999 / password=admin123');
  console.log('   Demo members : IND000501–IND000510 / password=member123');
  console.log('   Company users: IND000001–IND000500 (no login — network placeholders)');
}

main().catch(console.error).finally(() => db.$disconnect());
```

---

## 10. API Routes

**Base URL:** `http://localhost:4000/api`

### `/api/auth`
| Method | Path           | Auth  | Description                                                  |
|--------|----------------|-------|--------------------------------------------------------------|
| POST   | `/register`    | No    | Create PENDING real user → assign IND000501+ ID → `{ userId, memberId }` |
| POST   | `/verify-otp`  | No    | OTP=`123456` → add to network → JWT                         |
| POST   | `/login`       | No    | Mobile/email + password → JWT                                |
| POST   | `/refresh`     | No    | Refresh token → new access token                             |

### `/api/users`
| Method | Path   | Auth   | Description                       |
|--------|--------|--------|-----------------------------------|
| GET    | `/me`  | Member | Own profile + memberId + level    |
| PUT    | `/me`  | Member | Update name / email               |

### `/api/network`
| Method | Path        | Auth   | Description                                              |
|--------|-------------|--------|----------------------------------------------------------|
| GET    | `/upline`   | Member | Upline chain — shows COMPANY badge for IND000001–500    |
| GET    | `/downline` | Member | Downline tree (real members only shown, company filtered if deep) |
| GET    | `/stats`    | Member | `{ level, memberId, direct, total, realDownlines }`      |

### `/api/joining`
| Method | Path           | Auth   | Description                                |
|--------|----------------|--------|--------------------------------------------|
| POST   | `/request`     | Member | Submit joining request (one per user)      |
| GET    | `/my`          | Member | Own request status + memberId              |
| GET    | `/all`         | Admin  | All requests with memberId + user info     |
| POST   | `/:id/approve` | Admin  | Approve → `processJoiningPayout()`         |
| POST   | `/:id/reject`  | Admin  | Reject with note                           |

### `/api/wallet`
| Method | Path             | Auth   | Description                     |
|--------|------------------|--------|---------------------------------|
| GET    | `/`              | Member | Balances                        |
| GET    | `/transactions`  | Member | History (paginated)             |

### `/api/products` & `/api/orders`
_(Same as previous spec — unchanged)_

### `/api/admin`
| Method | Path                  | Auth  | Description                                             |
|--------|-----------------------|-------|---------------------------------------------------------|
| GET    | `/stats`              | Admin | KPIs + split: company-wallet revenue vs real-user payouts |
| GET    | `/members`            | Admin | Filter by `userType` (COMPANY / REAL), search by memberId / name |
| GET    | `/gst-report`         | Admin | GST records                                             |
| GET    | `/payout-log`         | Admin | Payout log with `recipientType` column (COMPANY / REAL) |
| GET    | `/company-revenue`    | Admin | Sum of all payouts credited to COMPANY user wallets     |

---

## 11. Frontend Pages

### App Shell (unchanged — sidebar desktop / bottom tab mobile)

---

### `/register` — Register Page
- Form: Name · Mobile · Email · Password · **Referral Member ID** (e.g. `IND000501`) — required
- On submit → register API → returns `memberId` → show it prominently: *"Your Member ID: IND000502"*
- OTP step — hint: *"Prototype: OTP is 123456"*
- On verify → redirect to `/dashboard`

### `/login` — Login Page
- Accepts mobile **or** email + password
- Show *"Member ID"* field as read-only (fetched after login)

### `/dashboard` — Home
- **Member ID badge** prominently at top: `IND000502` with copy icon
- **Wallet Cards** (Coupon + Income)
- **Plan status**: Level badge · Referral link showing own memberId as code
- **Payout preview**: shows which upline slots are company vs real users (visual indicator)
- Recent Activity (last 5 transactions)
- Network chips: Direct · Total

### `/network` — Network Tree

**Upline Tab** — vertical card list (root → direct parent):
- Company users (IND000001–500): shown with 🏢 badge, grey background, "Company Node" label
- Real users (IND000501+): shown with 👤 badge, teal background, full name + memberId

**Downline Tab**:
- Desktop: D3 collapsible tree — company nodes grey, real nodes teal
- Mobile: accordion list — same colour coding

**Stats bar**: Your Level · Your MemberID · Direct: N · Total Real Users: N

### `/join-request` — Joining Request
- Instruction card: *"Pay ₹1,000 cash to the admin, mention your Member ID (IND000XXX) and then submit below"*
- Status badge shows memberId next to status

### `/shop`, `/wallet`, `/profile` — unchanged from previous spec

### `/admin` — Admin Dashboard

**Tab — Overview**
- KPI cards:
  - Total Members (company + real)
  - Real Members (IND000501+)
  - Today's Joinings
  - Total Payouts: `₹X → Real Users` · `₹Y → Company Wallets`
  - GST Collected · Company Direct Profit (₹70 × joinings)
- Bar chart: Daily joinings (last 30 days)

**Tab — Joining Requests**
- Table with columns: MemberID · Name · Mobile · Referrer MemberID · Submitted · Status · Actions
- Approve/Reject with confirmation modal

**Tab — Members**
- Toggle filter: **All · Company Users · Real Users**
- Search: by MemberID (e.g. "IND000503") or name or mobile
- Company users table: MemberID · Level · Income Wallet (company revenue)
- Real users table: MemberID · Name · Mobile · Level · Status · Coupon Balance · Income Balance

**Tab — Payout Log**
- Columns: Joiner MemberID · Recipient MemberID · Recipient Type (🏢 Company / 👤 Real) · d-Level · Amount · Date
- Filter: **All · Company Recipients · Real Recipients**

**Tab — Company Revenue**
- Shows total income credited to company wallets (IND000001–500) from payout slots
- Formula: `(slots filled by company users) × ₹250`
- Breakdown table by date

**Tab — GST Report**
- Date range filter + CSV download

---

## 12. Payout Slot Visualisation (Dashboard Widget)

Show the user a visual of their current d-1, d-4, d-5 upline positions so they understand who earns when they refer someone. This is shown on the Dashboard and Network pages:

```
YOUR REFERRAL PAYOUT SLOTS
When you refer someone, these members earn ₹250 each:

  d-1 (Direct above you):   IND000500  🏢 Company
  d-4 (4 levels above you): IND000497  🏢 Company
  d-5 (5 levels above you): IND000496  🏢 Company

As more real users build up above you, company slots
will be replaced by real earners.
```

This widget is built by:
1. Fetching the user's upline chain
2. Applying `getPayoutOffsets(level)` to pick the d-1, d-4, d-5 ancestors
3. Displaying each with userType badge

---

## 13. Build Tasks for Antigravity Agent

> Use **Plan Mode**. Antigravity will generate a task list from each phase.

---

### Phase 1 — Scaffold

**Task 1.1** — Root `package.json` with `dev` (concurrently client + server), `seed`, `build`
**Task 1.2** — Server: Express + TypeScript + Prisma + bcryptjs + jsonwebtoken + cors + dotenv
**Task 1.3** — Client: Vite React TS + Tailwind + react-router-dom + @reduxjs/toolkit + react-redux + react-hot-toast + react-qr-code + d3 + recharts
**Task 1.4** — Create `schema.prisma` from Section 5 exactly. Run `prisma migrate dev --name init`.
**Task 1.5** — Create `seed.ts` from Section 9 exactly. Run `npm run seed`.
**Task 1.6** — Create `.env` from `.env.example`.

---

### Phase 2 — Backend

**Task 2.1** — `memberIdService.ts` — `generateNextMemberId()` using `MemberSequence` table atomic update.
**Task 2.2** — `networkService.ts` — `addToNetwork()`, `getUplineChain()`, `getDownlineTree()` from Section 8.2.
**Task 2.3** — `payoutEngine.ts` — `getPayoutOffsets()`, `processJoiningPayout()` from Section 8.1. Records `recipientType`.
**Task 2.4** — `walletService.ts` — `purchaseProduct()` from Section 8.3.
**Task 2.5** — Middleware: `jwtAuth.ts`, `requireAdmin.ts`, `errorHandler.ts`.
**Task 2.6** — Auth routes from Section 10 — registration assigns IND ID, returns `memberId` in response.
**Task 2.7** — Network routes — upline shows `userType` for each node.
**Task 2.8** — Joining routes — approve calls `processJoiningPayout`.
**Task 2.9** — Wallet, product, order routes.
**Task 2.10** — Admin routes — `/stats` splits payouts by recipientType. `/company-revenue` sums company wallet income. `/members` supports `?type=COMPANY|REAL` filter.

---

### Phase 3 — Frontend

**Task 3.1** — App shell: responsive layout (sidebar desktop / bottom tabs mobile). `ProtectedRoute`, `AdminRoute`.
**Task 3.2** — RTK Query API slice: all endpoints from Section 10. JWT auto-attach + 401 refresh.
**Task 3.3** — Register page: two-step (form → OTP). Display assigned `memberId` on success.
**Task 3.4** — Login page.
**Task 3.5** — Dashboard: MemberID badge prominent · wallet cards · payout slot visualisation widget (Section 12) · recent activity · network chips.
**Task 3.6** — Network page: upline tab with 🏢/👤 badges · downline D3 tree (desktop) + accordion (mobile). Colour: grey=company, teal=real.
**Task 3.7** — Join request page: instructions + status display.
**Task 3.8** — Shop page: product grid + cart drawer + checkout modal.
**Task 3.9** — Wallet page: balance cards + tabbed transaction list.
**Task 3.10** — Admin dashboard: all 6 tabs (Overview · Requests · Members · Payout Log · Company Revenue · GST Report). MemberID visible everywhere.

---

### Phase 4 — Responsive QA & Demo Flow

**Task 4.1** — Mobile audit at 375px: no overflow, bottom tab visible, tables → cards, D3 → accordion.
**Task 4.2** — Loading skeletons, empty states, error toasts, success toasts.
**Task 4.3** — End-to-end demo:
  - Login as IND000505 (`9000000005` / `member123`)
  - Submit joining request → admin approves
  - Verify: IND000504 (d-1, real) +₹250 · IND000501 (d-4, real) +₹250 · IND000500 (d-5, company) +₹250
  - Login as IND000505, check coupon wallet = ₹1000
  - Buy Herbal Soap → coupon −₹50, income −₹50

---

## 14. Acceptance Tests

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Register without referral code | Placed under IND000500 (last company user) |
| 2 | Register with referral code IND000503 | Placed under IND000503 in network tree |
| 3 | First real user (IND000501) joining approved | All 3 payout slots go to company users (IND000500, 497, 496) |
| 4 | IND000505 joining approved | d-1=IND000504 (real +₹250) · d-4=IND000501 (real +₹250) · d-5=IND000500 (company +₹250) |
| 5 | Admin payout log | Shows COMPANY / REAL label per recipient row |
| 6 | Admin company revenue tab | Shows cumulative sum of payouts to company wallets |
| 7 | Duplicate approve attempt | Returns ALREADY_PROCESSED error |
| 8 | Joiner coupon after approval | ₹1,000 |
| 9 | Buy ₹100 product | Coupon −₹50 · Income −₹50 |
| 10 | Search member by "IND000503" in admin | Returns correct member |
| 11 | Dashboard payout slot widget | Shows correct d-1/d-4/d-5 ancestors with 🏢 or 👤 |
| 12 | Mobile 375px viewport | No overflow, bottom tab sticky, company/real badges visible |

---

## 15. Antigravity Knowledge Items

- **Member ID format**: `IND` + 6-digit zero-padded sequence. Company: 1–500. Real: 501+. Generated by `MemberSequence` table atomic increment.
- **Company users**: IND000001–IND000500. No login. Pre-seeded in linear chain. Wallets exist to receive payout income (company revenue).
- **Real users**: IND000501+. Register, log in, refer others, buy products.
- **Payout logic identical** for company and real recipients — no special casing. Only `recipientType` field differs for reporting.
- **Default parent**: if a real user registers without a referral code, place them under the last company user (IND000500).
- **Path format**: dot-separated UUID strings, e.g. `"uuid1.uuid2.uuid3"`. Self is last segment.
- **OTP is always `123456`** — env var `OTP_BYPASS_CODE`.
- **Admin credentials**: mobile `9999999999` / password `admin123`. MemberID = `ADMIN001`.
- **Demo real users**: IND000501–IND000510 / password `member123`.
- **Sequence table**: single row `{ id:1, lastSequence:500 }` at seed time. Each registration atomically increments it.
- **Wallet integers**: plain ₹ integers, no decimals.
- **All wallet ops inside `db.$transaction()`** — never update wallet outside transaction.

---

*End of PROJECT_SPEC.md — Feed to Google Antigravity Agent Manager in Plan Mode.*
