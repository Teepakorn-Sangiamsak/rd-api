const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Delete all records from tables in reverse order of dependencies
    console.log('📝 Deleting banned users...');
    await prisma.banned_User.deleteMany({});

    console.log('📝 Deleting admin proof checks...');
    await prisma.admin_Proof_Check.deleteMany({});

    console.log('📝 Deleting user proofs...');
    await prisma.user_Proof.deleteMany({});
    
    console.log('📝 Deleting user badges...');
    await prisma.user_Badge.deleteMany({});
    
    console.log('📝 Deleting badges...');
    await prisma.badge.deleteMany({});
    
    console.log('📝 Deleting challenge categories...');
    await prisma.challenge_Category.deleteMany({});
    
    console.log('📝 Deleting user challenges...');
    await prisma.user_Challenge.deleteMany({});
    
    console.log('📝 Deleting created challenges...');
    await prisma.created_Challenge.deleteMany({});
    
    console.log('📝 Deleting challenges...');
    await prisma.challenge.deleteMany({});
    
    console.log('📝 Deleting categories...');
    await prisma.category.deleteMany({});
    
    console.log('📝 Deleting users...');
    await prisma.user.deleteMany({});

    console.log('✅ Database reset completed successfully.');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });