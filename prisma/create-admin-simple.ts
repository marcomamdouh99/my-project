import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Creating admin user...');

  try {
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existingUser) {
      console.log('Admin user already exists!');
      console.log('Username: admin');
      console.log('Email:', existingUser.email);
      console.log('Name:', existingUser.name);
      console.log('Role:', existingUser.role);
      console.log('Active:', existingUser.isActive ? 'Yes' : 'No');
      return;
    }

    // Create password hash
    const password = 'admin123'; // CHANGE THIS to your desired password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@franchise.com',
        passwordHash,
        name: 'HQ Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('==============================');
    console.log('Username: admin');
    console.log('Email:', admin.email);
    console.log('Password:', password);
    console.log('Name:', admin.name);
    console.log('Role:', admin.role);
    console.log('User ID:', admin.id);
    console.log('==============================\n');

    console.log('You can now login with:');
    console.log('Username: admin');
    console.log('Password:', password);
    console.log('');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
