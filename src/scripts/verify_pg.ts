import { prisma } from '../lib/prisma';

async function verify() {
  const count = await prisma.reel.count();
  const agg = await prisma.reel.aggregate({
    _sum: {
      weight: true,
      usedWeight: true,
      balanceWeight: true,
      reelAmount: true,
      balanceAmount: true,
    },
  });

  const sample = await prisma.reel.findMany({ take: 3 });

  console.log('=== POSTGRESQL VERIFICATION ===');
  console.log(`Database connected: PostgreSQL at localhost:5432 / paper_reel_db`);
  console.log(`Total Reels in PostgreSQL: ${count}`);
  console.log(`Total Weight: ${agg._sum.weight} KG`);
  console.log(`Used Weight: ${agg._sum.usedWeight} KG`);
  console.log(`Available Balance Weight: ${agg._sum.balanceWeight} KG`);
  console.log(`Total Valuation: ₹${agg._sum.reelAmount}`);
  console.log(`Available Balance Valuation: ₹${agg._sum.balanceAmount}`);
  console.log('\nSample Reels in PostgreSQL:');
  sample.forEach((r) => {
    console.log(`- Reel #${r.reelNo}: ${r.sizeDesc}, ${r.gsm} GSM, ${r.weight} KG, Mill: ${r.millName}`);
  });
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
