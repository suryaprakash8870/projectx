import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Step 1: Initialise sequence table ──────────────────────────────────────
  await db.memberSequence.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastSequence: 512 },
  });
  console.log('✅ Member sequence initialized (lastSequence = 512)');

  // ── Step 2: Create 512 company users as a COMPLETE BINARY TREE ────────────
  //
  // Structure (10 levels deep, 512 nodes in a complete binary tree):
  //
  //                        IND00001 (root, level 1)
  //                       /          \
  //               IND00002          IND00003  (level 2)
  //              /        \          /        \
  //         IND00004  IND00005 IND00006  IND00007  (level 3)
  //          / \        / \       / \        / \
  //        ...  ...   ...  ...  ...  ...   ...  ...
  //        ...                                   ...   (level 9: IND00256–IND00512)
  //
  // Each root user is a STANDALONE node — no tree links between them.
  // They only appear in each other's tree when one actually refers another person.
  //
  // All root users have login credentials:
  //   Mobile: 80000XXXXX (e.g., IND00003 → 8000000003)
  //   Password: company123
  //
  console.log('\nCreating 512 standalone root users (IND00001–IND00512)...');

  const companyPassword = await bcrypt.hash('company123', 10);

  for (let i = 1; i <= 512; i++) {
    const memberId = `IND${String(i).padStart(5, '0')}`;
    const mobile = `80${String(i).padStart(8, '0')}`;

    const user: any = await db.user.create({
      data: {
        memberId,
        sequenceNumber: i,
        name: memberId,
        mobile,
        email: `${memberId.toLowerCase()}@company.planone.com`,
        passwordHash: companyPassword,
        referrerId: null,    // root users have NO referrer
        level: 1,
        cyclePosition: 1,   // all users start at cycle 1 (L1 & L2)
        role: 'MEMBER',
        status: 'ACTIVE',
        placementLeg: null,
      },
    });

    // Standalone network node — each root user is its own tree root
    await db.networkNode.create({
      data: {
        userId: user.id,
        parentId: null,
        position: null,
        level: 1,
        path: user.id,
      },
    });

    await db.wallet.create({
      data: {
        userId: user.id,
        couponBalance: 0,
        purchaseBalance: 0,
        incomeBalance: 0,
        gstBalance: 0,
      },
    });

    if (i % 100 === 0) console.log(`  Created ${i}/512 root users...`);
  }
  console.log('✅ 512 standalone root users created (Level 1, no tree links)');
  console.log('   Login: mobile=80000000XX / password=company123');
  console.log('   E.g., IND00003 → mobile: 8000000003');

  // ── Step 3: Admin user (not in network tree) ───────────────────────────────
  const admin = await db.user.create({
    data: {
      memberId: 'ADMIN001',
      sequenceNumber: 0,
      name: 'Admin',
      mobile: '9999999999',
      email: 'admin@planone.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      status: 'ACTIVE',
      level: 0,
      cyclePosition: 1,
    },
  });

  // Admin's wallet — holds all company-fallback referral income
  // (missing upline slots pay into this wallet)
  await db.wallet.create({
    data: {
      userId: admin.id,
      couponBalance: 0,
      purchaseBalance: 0,
      incomeBalance: 0,
      gstBalance: 0,
    },
  });
  console.log('✅ Admin user + wallet created (mobile: 9999999999, password: admin123)');

  // ── Step 4: Categories ─────────────────────────────────────────────────────
  const categoryNames = [
    'Electronics',
    'Fashion & Apparel',
    'Grocery & Food',
    'Health & Wellness',
    'Home & Kitchen',
    'Beauty & Personal Care',
    'Sports & Fitness',
    'Books & Stationery',
    'Automotive',
    'Services',
  ];

  const categories = [];
  for (const name of categoryNames) {
    const cat = await db.category.create({
      data: { name, description: `${name} products and services` },
    });
    categories.push(cat);
  }
  console.log(`✅ ${categories.length} categories created`);

  // ── Step 5: Demo products ──────────────────────────────────────────────────
  const demoProducts = [
    { name: 'Wireless Earbuds', price: 2500, catIdx: 0, desc: 'Bluetooth 5.0 earbuds with noise cancellation' },
    { name: 'Smart Watch', price: 4500, catIdx: 0, desc: 'Fitness tracker with heart rate monitor' },
    { name: 'Cotton T-Shirt', price: 800, catIdx: 1, desc: 'Premium cotton t-shirt, all sizes' },
    { name: 'Protein Powder', price: 1800, catIdx: 3, desc: 'Whey protein 1kg vanilla flavor' },
    { name: 'Yoga Mat', price: 600, catIdx: 6, desc: 'Non-slip exercise mat 6mm thick' },
    { name: 'Face Cream', price: 450, catIdx: 5, desc: 'Natural herbal face cream 100ml' },
    { name: 'Notebook Set', price: 350, catIdx: 7, desc: 'Pack of 5 ruled notebooks' },
    { name: 'Kitchen Blender', price: 2200, catIdx: 4, desc: '500W mixer grinder with 3 jars' },
    { name: 'Rice 5kg', price: 500, catIdx: 2, desc: 'Premium basmati rice 5kg pack' },
    { name: 'Car Phone Mount', price: 350, catIdx: 8, desc: 'Magnetic car phone holder' },
  ];

  for (const p of demoProducts) {
    await db.product.create({
      data: {
        name: p.name,
        price: p.price,
        description: p.desc,
        categoryId: categories[p.catIdx].id,
        couponSplitPct: 50,
        imageUrl: null,
      },
    });
  }
  console.log(`✅ ${demoProducts.length} demo products created`);

  console.log('\n🎉 Seeding complete!');
  console.log('\n   Logins:');
  console.log('   ─────────────────────────────────────────────────────────');
  console.log('   Admin        : mobile=9999999999  / password=admin123');
  console.log('   Root users   : mobile=80000000XX  / password=company123');
  console.log('     e.g. IND00001 → 8000000001, IND00512 → 8000000512');
  console.log('   ─────────────────────────────────────────────────────────');
  console.log('\n   512 root users (Level 1) seeded as binary tree for visualization.');
  console.log('   No demo users — register manually to test.');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
