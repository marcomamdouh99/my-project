import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

async function createAdminUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  console.log('\n=== Create Admin User ===\n');

  try {
    // Get user input
    const username = await question('Enter username (default: admin): ') || 'admin';
    const email = await question('Enter email (default: admin@franchise.com): ') || 'admin@franchise.com';
    const name = await question('Enter full name (default: HQ Admin): ') || 'HQ Admin';

    const { createHash } = await import('crypto');
    const passwordInput = await question('Enter password (default: demo123): ');
    const password = passwordInput || 'demo123';

    // Generate password hash (bcrypt compatible)
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('\nCreating admin user with the following details:');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Role: ADMIN`);
    console.log(`Password: ${password}`);

    const confirm = await question('\nCreate this user? (y/n): ');

    if (confirm.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      rl.close();
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      console.log(`\n❌ User already exists with username '${existingUser.username}' or email '${existingUser.email}'`);
      rl.close();
      return;
    }

    // Create admin user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        name,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log(`\n✅ Admin user created successfully!`);
    console.log(`User ID: ${user.id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Password: ${password}\n`);

    console.log('You can now login with these credentials.\n');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdminUser();
