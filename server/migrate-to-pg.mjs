/**
 * migrate-to-pg.mjs
 * Migrates all data from local SQLite dev.db → Render PostgreSQL
 * Usage: node migrate-to-pg.mjs "<POSTGRES_EXTERNAL_URL>"
 */

import Database from 'better-sqlite3';
import pg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pgUrl = process.argv[2];
if (!pgUrl) {
  console.error('❌  Usage: node migrate-to-pg.mjs "<POSTGRES_EXTERNAL_URL>"');
  process.exit(1);
}

// ── 1. Open SQLite ─────────────────────────────────────────────────────────────
const dbPath = path.join(__dirname, 'src', 'prisma', 'dev.db');
console.log(`\n📖  Opening SQLite: ${dbPath}`);
const db = new Database(dbPath, { readonly: true });

function all(table) {
  try { return db.prepare(`SELECT * FROM "${table}"`).all(); }
  catch { return []; }
}

const users       = all('User');
const memberSeq   = all('MemberSequence');
const joinings    = all('JoiningRequest');
const nodes       = all('NetworkNode');
const wallets     = all('Wallet');
const txns        = all('WalletTransaction');
const payouts     = all('PayoutRecord');
const gstRecords  = all('GstRecord');
const categories  = all('Category');
const vendors     = all('Vendor');
const products    = all('Product');
const orders      = all('Order');
const revSplits   = all('RevenueSplit');
const otps        = all('OtpRecord');
const rateLimits  = all('RateLimitEntry');

db.close();

console.log(`   Users: ${users.length} | Wallets: ${wallets.length} | Txns: ${txns.length}`);
console.log(`   Joinings: ${joinings.length} | Nodes: ${nodes.length} | Payouts: ${payouts.length}`);
console.log(`   Categories: ${categories.length} | Vendors: ${vendors.length} | Products: ${products.length}`);
console.log(`   Orders: ${orders.length} | GST: ${gstRecords.length} | RevSplits: ${revSplits.length}`);
console.log(`   OTPs: ${otps.length} | RateLimits: ${rateLimits.length}`);

// ── 2. Connect to PostgreSQL ───────────────────────────────────────────────────
console.log('\n🔌  Connecting to PostgreSQL …');
const pool = new pg.Pool({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });

async function q(sql, params = []) {
  return pool.query(sql, params);
}

// SQLite stores booleans as 0/1, dates as strings — helpers to fix that
const bool = v => v === 1 || v === true;
const dt   = v => v ? new Date(v) : null;
const n    = v => (v === undefined || v === null) ? null : v;

// ── 3. Insert in dependency order ──────────────────────────────────────────────
console.log('\n⬆️   Inserting data …\n');

// MemberSequence
for (const r of memberSeq) {
  await q(
    `INSERT INTO "MemberSequence"(id,"lastSequence") VALUES($1,$2)
     ON CONFLICT(id) DO UPDATE SET "lastSequence"=EXCLUDED."lastSequence"`,
    [r.id, r.lastSequence]
  );
}
console.log(`   ✅ MemberSequence  (${memberSeq.length})`);

// Users
for (const r of users) {
  await q(
    `INSERT INTO "User"(id,"memberId","sequenceNumber",name,mobile,email,"passwordHash",
      "referrerId",level,"cyclePosition",role,"placementLeg",status,"createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.memberId, r.sequenceNumber, r.name, n(r.mobile), n(r.email),
     n(r.passwordHash), n(r.referrerId), r.level, r.cyclePosition,
     r.role, n(r.placementLeg), r.status, dt(r.createdAt)]
  );
}
console.log(`   ✅ Users           (${users.length})`);

// JoiningRequests
for (const r of joinings) {
  await q(
    `INSERT INTO "JoiningRequest"(id,"userId",amount,status,note,"approvedAt","createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.userId, r.amount, r.status, n(r.note), dt(r.approvedAt), dt(r.createdAt)]
  );
}
console.log(`   ✅ JoiningRequests (${joinings.length})`);

// NetworkNodes
for (const r of nodes) {
  await q(
    `INSERT INTO "NetworkNode"("userId","parentId",position,level,path)
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT("userId") DO NOTHING`,
    [r.userId, n(r.parentId), n(r.position), r.level, r.path]
  );
}
console.log(`   ✅ NetworkNodes    (${nodes.length})`);

// Wallets
for (const r of wallets) {
  await q(
    `INSERT INTO "Wallet"(id,"userId","couponBalance","purchaseBalance","incomeBalance","gstBalance","updatedAt")
     VALUES($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.userId, r.couponBalance, r.purchaseBalance, r.incomeBalance, r.gstBalance, dt(r.updatedAt)]
  );
}
console.log(`   ✅ Wallets         (${wallets.length})`);

// WalletTransactions
for (const r of txns) {
  await q(
    `INSERT INTO "WalletTransaction"(id,"walletId",type,field,amount,note,"sourceRef","createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.walletId, r.type, r.field, r.amount, n(r.note), n(r.sourceRef), dt(r.createdAt)]
  );
}
console.log(`   ✅ WalletTxns      (${txns.length})`);

// PayoutRecords
for (const r of payouts) {
  await q(
    `INSERT INTO "PayoutRecord"(id,"requestId","joinerId","recipientId","levelDiff","cycleSlot",amount,"createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.requestId, r.joinerId, r.recipientId, r.levelDiff, r.cycleSlot, r.amount, dt(r.createdAt)]
  );
}
console.log(`   ✅ PayoutRecords   (${payouts.length})`);

// GstRecords
for (const r of gstRecords) {
  await q(
    `INSERT INTO "GstRecord"(id,"requestId",amount,"createdAt")
     VALUES($1,$2,$3,$4)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.requestId, r.amount, dt(r.createdAt)]
  );
}
console.log(`   ✅ GstRecords      (${gstRecords.length})`);

// Categories
for (const r of categories) {
  await q(
    `INSERT INTO "Category"(id,name,description,"isActive","createdAt")
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.name, n(r.description), bool(r.isActive), dt(r.createdAt)]
  );
}
console.log(`   ✅ Categories      (${categories.length})`);

// Vendors
for (const r of vendors) {
  await q(
    `INSERT INTO "Vendor"(id,"userId","businessName","categoryId","pinCode","platformFee","isApproved","isActive","createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.userId, r.businessName, r.categoryId, r.pinCode, r.platformFee,
     bool(r.isApproved), bool(r.isActive), dt(r.createdAt)]
  );
}
console.log(`   ✅ Vendors         (${vendors.length})`);

// Products
for (const r of products) {
  await q(
    `INSERT INTO "Product"(id,name,description,price,"categoryId","couponSplitPct","imageUrl","isActive","createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.name, n(r.description), r.price, n(r.categoryId), r.couponSplitPct,
     n(r.imageUrl), bool(r.isActive), dt(r.createdAt)]
  );
}
console.log(`   ✅ Products        (${products.length})`);

// Orders
for (const r of orders) {
  await q(
    `INSERT INTO "Order"(id,"userId","productId",quantity,"totalAmount","cashPaid","couponUsed",cashback,status,"placedAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.userId, r.productId, r.quantity, r.totalAmount,
     r.cashPaid, r.couponUsed, r.cashback, r.status, dt(r.placedAt)]
  );
}
console.log(`   ✅ Orders          (${orders.length})`);

// RevenueSplits
for (const r of revSplits) {
  await q(
    `INSERT INTO "RevenueSplit"(id,"orderId","totalAmount","gstAmount","companyAmount","userAmount","platformFee","createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.orderId, r.totalAmount, r.gstAmount, r.companyAmount,
     r.userAmount, r.platformFee, dt(r.createdAt)]
  );
}
console.log(`   ✅ RevenueSplits   (${revSplits.length})`);

// OtpRecords
for (const r of otps) {
  await q(
    `INSERT INTO "OtpRecord"(id,mobile,email,code,purpose,"expiresAt","isUsed","createdAt")
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, n(r.mobile), n(r.email), r.code, r.purpose,
     dt(r.expiresAt), bool(r.isUsed), dt(r.createdAt)]
  );
}
console.log(`   ✅ OtpRecords      (${otps.length})`);

// RateLimitEntries
for (const r of rateLimits) {
  await q(
    `INSERT INTO "RateLimitEntry"(id,key,action,count,"windowStart")
     VALUES($1,$2,$3,$4,$5)
     ON CONFLICT(id) DO NOTHING`,
    [r.id, r.key, r.action, r.count, dt(r.windowStart)]
  );
}
console.log(`   ✅ RateLimitEntries(${rateLimits.length})`);

// ── Done ──────────────────────────────────────────────────────────────────────
await pool.end();
console.log('\n🎉  Migration complete! All SQLite data is now in PostgreSQL.\n');
