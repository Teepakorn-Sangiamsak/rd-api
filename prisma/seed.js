const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin and regular user accounts
    console.log('👤 Creating users...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        username: 'admin',
        firstname: 'Admin',
        lastname: 'User',
        email: 'admin@example.com',
        password: hashedAdminPassword,
        role: 'ADMIN',
        level: 10,
        exp: 5000,
      },
    });

    const hashedUserPassword = await bcrypt.hash('user123', 10);
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        username: 'user',
        firstname: 'Regular',
        lastname: 'User',
        email: 'user@example.com',
        password: hashedUserPassword,
        role: 'USER',
        level: 5,
        exp: 2500,
      },
    });

    // Create categories
    console.log('📋 Creating categories...');
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Fitness' },
        update: {},
        create: { name: 'Fitness', updatedAt: new Date() },
      }),
      prisma.category.upsert({
        where: { name: 'Education' },
        update: {},
        create: { name: 'Education', updatedAt: new Date() },
      }),
      prisma.category.upsert({
        where: { name: 'Nutrition' },
        update: {},
        create: { name: 'Nutrition', updatedAt: new Date() },
      }),
      prisma.category.upsert({
        where: { name: 'Mindfulness' },
        update: {},
        create: { name: 'Mindfulness', updatedAt: new Date() },
      }),
      prisma.category.upsert({
        where: { name: 'Social' },
        update: {},
        create: { name: 'Social', updatedAt: new Date() },
      }),
    ]);

    // Create badges
    console.log('🏆 Creating badges...');
    const badges = await Promise.all([
      prisma.badge.create({
        data: {
          name: 'Fitness Beginner',
          description: 'Complete your first fitness challenge',
          condition: 'CHALLENGE_COMPLETED',
        },
      }),
      prisma.badge.create({
        data: {
          name: 'Level 5 Achiever',
          description: 'Reach level 5',
          condition: 'EXP',
        },
      }),
      prisma.badge.create({
        data: {
          name: 'Challenge Master',
          description: 'Complete 10 challenges',
          condition: 'CHALLENGE_COMPLETED',
        },
      }),
      prisma.badge.create({
        data: {
          name: 'Community Builder',
          description: 'Create 5 public challenges',
          condition: 'SPECIAL_ACHIEVEMENT',
        },
      }),
    ]);

    // Create sample challenges
    console.log('🏋️ Creating challenges...');
    const challenges = await Promise.all([
      prisma.challenge.create({
        data: {
          name: '30-Day Fitness Challenge',
          description: 'Exercise for at least 30 minutes every day for 30 days',
          expReward: 500,
          status: 'PUBLIC',
          requirementType: 'PROOF',
          createdBy: adminUser.id,
        },
      }),
      prisma.challenge.create({
        data: {
          name: 'Read 5 Books in a Month',
          description: 'Challenge yourself to read 5 books in the next 30 days',
          expReward: 300,
          status: 'PUBLIC',
          requirementType: 'PROOF',
          createdBy: adminUser.id,
        },
      }),
      prisma.challenge.create({
        data: {
          name: 'Meditation Marathon',
          description: 'Meditate for at least 10 minutes daily for 21 days',
          expReward: 400,
          status: 'PUBLIC',
          requirementType: 'PROOF',
          createdBy: regularUser.id,
        },
      }),
      prisma.challenge.create({
        data: {
          name: 'Healthy Eating Week',
          description: 'Eat only home-cooked meals for a full week',
          expReward: 200,
          status: 'PUBLIC',
          requirementType: 'PROOF',
          createdBy: regularUser.id,
        },
      }),
    ]);

    // Link challenges to categories
    console.log('🔗 Linking challenges to categories...');
    await Promise.all([
      prisma.challenge_Category.create({
        data: {
          challengeId: challenges[0].id,
          categoryId: categories[0].id, // Fitness
        },
      }),
      prisma.challenge_Category.create({
        data: {
          challengeId: challenges[1].id,
          categoryId: categories[1].id, // Education
        },
      }),
      prisma.challenge_Category.create({
        data: {
          challengeId: challenges[2].id,
          categoryId: categories[3].id, // Mindfulness
        },
      }),
      prisma.challenge_Category.create({
        data: {
          challengeId: challenges[3].id,
          categoryId: categories[2].id, // Nutrition
        },
      }),
    ]);

    // Create challenge creators
    console.log('🧑‍🔧 Registering challenge creators...');
    await Promise.all([
      prisma.created_Challenge.create({
        data: {
          userId: adminUser.id,
          challengeId: challenges[0].id,
        },
      }),
      prisma.created_Challenge.create({
        data: {
          userId: adminUser.id,
          challengeId: challenges[1].id,
        },
      }),
      prisma.created_Challenge.create({
        data: {
          userId: regularUser.id,
          challengeId: challenges[2].id,
        },
      }),
      prisma.created_Challenge.create({
        data: {
          userId: regularUser.id,
          challengeId: challenges[3].id,
        },
      }),
    ]);

    // Have the regular user join some challenges
    console.log('🙋‍♂️ Having users join challenges...');
    await Promise.all([
      prisma.user_Challenge.create({
        data: {
          userId: regularUser.id,
          challengeId: challenges[0].id,
          status: 'IN_PROGRESS',
        },
      }),
      prisma.user_Challenge.create({
        data: {
          userId: regularUser.id,
          challengeId: challenges[1].id,
          status: 'COMPLETED',
          submittedAt: new Date(),
        },
      }),
    ]);

    // Assign some badges to the regular user
    console.log('🎖️ Assigning badges...');
    await Promise.all([
      prisma.user_Badge.create({
        data: {
          userId: regularUser.id,
          badgeId: badges[1].id, // Level 5 Achiever
        },
      }),
    ]);

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });