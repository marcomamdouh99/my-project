import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create branches
  const branch1 = await prisma.branch.upsert({
    where: { branchName: 'Downtown' },
    update: {},
    create: {
      branchName: 'Downtown',
      licenseKey: 'LICENSE-DOWNTOWN-2024',
      licenseExpiresAt: new Date('2025-12-31'),
      isActive: true,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { branchName: 'Airport' },
    update: {},
    create: {
      branchName: 'Airport',
      licenseKey: 'LICENSE-AIRPORT-2024',
      licenseExpiresAt: new Date('2025-12-31'),
      isActive: true,
    },
  });

  console.log('Created branches:', branch1.branchName, branch2.branchName);

  // Create password hash
  const passwordHash = await bcrypt.hash('demo123', 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@franchise.com',
      passwordHash,
      name: 'HQ Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const manager1 = await prisma.user.upsert({
    where: { username: 'manager1' },
    update: {},
    create: {
      username: 'manager1',
      email: 'manager1@franchise.com',
      passwordHash,
      name: 'John Smith',
      role: 'BRANCH_MANAGER',
      branchId: branch1.id,
      isActive: true,
    },
  });

  const manager2 = await prisma.user.upsert({
    where: { username: 'manager2' },
    update: {},
    create: {
      username: 'manager2',
      email: 'manager2@franchise.com',
      passwordHash,
      name: 'Alice Johnson',
      role: 'BRANCH_MANAGER',
      branchId: branch2.id,
      isActive: true,
    },
  });

  const cashier1 = await prisma.user.upsert({
    where: { username: 'cashier1' },
    update: {},
    create: {
      username: 'cashier1',
      email: 'cashier1@franchise.com',
      passwordHash,
      name: 'Jane Doe',
      role: 'CASHIER',
      branchId: branch1.id,
      isActive: true,
    },
  });

  const cashier2 = await prisma.user.upsert({
    where: { username: 'cashier2' },
    update: {},
    create: {
      username: 'cashier2',
      email: 'cashier2@franchise.com',
      passwordHash,
      name: 'Bob Wilson',
      role: 'CASHIER',
      branchId: branch1.id,
      isActive: true,
    },
  });

  console.log('Created users:', admin.username, manager1.username, manager2.username, cashier1.username, cashier2.username);

  // Create ingredients
  const ingredients = await Promise.all([
    prisma.ingredient.upsert({
      where: { name: 'Coffee Beans' },
      update: {},
      create: {
        name: 'Coffee Beans',
        unit: 'kg',
        costPerUnit: 15.00,
        reorderThreshold: 10,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Milk' },
      update: {},
      create: {
        name: 'Milk',
        unit: 'L',
        costPerUnit: 2.00,
        reorderThreshold: 20,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Sugar' },
      update: {},
      create: {
        name: 'Sugar',
        unit: 'kg',
        costPerUnit: 3.00,
        reorderThreshold: 5,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Flour' },
      update: {},
      create: {
        name: 'Flour',
        unit: 'kg',
        costPerUnit: 4.00,
        reorderThreshold: 10,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Chocolate' },
      update: {},
      create: {
        name: 'Chocolate',
        unit: 'kg',
        costPerUnit: 12.00,
        reorderThreshold: 5,
      },
    }),
    prisma.ingredient.upsert({
      where: { name: 'Vanilla Syrup' },
      update: {},
      create: {
        name: 'Vanilla Syrup',
        unit: 'L',
        costPerUnit: 8.00,
        reorderThreshold: 5,
      },
    }),
  ]);

  console.log('Created ingredients:', ingredients.map(i => i.name));

  // Create menu items
  const espresso = await prisma.menuItem.upsert({
    where: { id: 'menu-espresso' },
    update: {},
    create: {
      id: 'menu-espresso',
      name: 'Espresso',
      category: 'hot-drinks',
      price: 3.50,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 1,
    },
  });

  const americano = await prisma.menuItem.upsert({
    where: { id: 'menu-americano' },
    update: {},
    create: {
      id: 'menu-americano',
      name: 'Americano',
      category: 'hot-drinks',
      price: 4.00,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 2,
    },
  });

  const latte = await prisma.menuItem.upsert({
    where: { id: 'menu-latte' },
    update: {},
    create: {
      id: 'menu-latte',
      name: 'Latte',
      category: 'hot-drinks',
      price: 5.50,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 3,
    },
  });

  const cappuccino = await prisma.menuItem.upsert({
    where: { id: 'menu-cappuccino' },
    update: {},
    create: {
      id: 'menu-cappuccino',
      name: 'Cappuccino',
      category: 'hot-drinks',
      price: 5.00,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 4,
    },
  });

  const icedLatte = await prisma.menuItem.upsert({
    where: { id: 'menu-iced-latte' },
    update: {},
    create: {
      id: 'menu-iced-latte',
      name: 'Iced Latte',
      category: 'cold-drinks',
      price: 5.50,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 5,
    },
  });

  const icedAmericano = await prisma.menuItem.upsert({
    where: { id: 'menu-iced-americano' },
    update: {},
    create: {
      id: 'menu-iced-americano',
      name: 'Iced Americano',
      category: 'cold-drinks',
      price: 4.50,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 6,
    },
  });

  const croissant = await prisma.menuItem.upsert({
    where: { id: 'menu-croissant' },
    update: {},
    create: {
      id: 'menu-croissant',
      name: 'Croissant',
      category: 'pastries',
      price: 3.00,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 7,
    },
  });

  const muffin = await prisma.menuItem.upsert({
    where: { id: 'menu-muffin' },
    update: {},
    create: {
      id: 'menu-muffin',
      name: 'Muffin',
      category: 'pastries',
      price: 3.50,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 8,
    },
  });

  const cookie = await prisma.menuItem.upsert({
    where: { id: 'menu-cookie' },
    update: {},
    create: {
      id: 'menu-cookie',
      name: 'Cookie',
      category: 'snacks',
      price: 2.50,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 9,
    },
  });

  const brownie = await prisma.menuItem.upsert({
    where: { id: 'menu-brownie' },
    update: {},
    create: {
      id: 'menu-brownie',
      name: 'Brownie',
      category: 'snacks',
      price: 3.00,
      taxRate: 0.14,
      isActive: true,
      sortOrder: 10,
    },
  });

  console.log('Created menu items');

  // Create recipes for coffee drinks
  const coffeeBeans = ingredients.find(i => i.name === 'Coffee Beans')!;
  const milk = ingredients.find(i => i.name === 'Milk')!;

  // Espresso recipe: 18g coffee beans
  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: espresso.id,
        ingredientId: coffeeBeans.id,
      },
    },
    update: {},
    create: {
      menuItemId: espresso.id,
      ingredientId: coffeeBeans.id,
      quantityRequired: 0.018,
      unit: 'kg',
    },
  });

  // Americano recipe: 18g coffee beans
  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: americano.id,
        ingredientId: coffeeBeans.id,
      },
    },
    update: {},
    create: {
      menuItemId: americano.id,
      ingredientId: coffeeBeans.id,
      quantityRequired: 0.018,
      unit: 'kg',
    },
  });

  // Latte recipe: 18g coffee beans + 200ml milk
  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: latte.id,
        ingredientId: coffeeBeans.id,
      },
    },
    update: {},
    create: {
      menuItemId: latte.id,
      ingredientId: coffeeBeans.id,
      quantityRequired: 0.018,
      unit: 'kg',
    },
  });

  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: latte.id,
        ingredientId: milk.id,
      },
    },
    update: {},
    create: {
      menuItemId: latte.id,
      ingredientId: milk.id,
      quantityRequired: 0.2,
      unit: 'L',
    },
  });

  // Cappuccino recipe: 18g coffee beans + 150ml milk
  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: cappuccino.id,
        ingredientId: coffeeBeans.id,
      },
    },
    update: {},
    create: {
      menuItemId: cappuccino.id,
      ingredientId: coffeeBeans.id,
      quantityRequired: 0.018,
      unit: 'kg',
    },
  });

  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: cappuccino.id,
        ingredientId: milk.id,
      },
    },
    update: {},
    create: {
      menuItemId: cappuccino.id,
      ingredientId: milk.id,
      quantityRequired: 0.15,
      unit: 'L',
    },
  });

  // Iced Latte recipe: 18g coffee beans + 200ml milk
  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: icedLatte.id,
        ingredientId: coffeeBeans.id,
      },
    },
    update: {},
    create: {
      menuItemId: icedLatte.id,
      ingredientId: coffeeBeans.id,
      quantityRequired: 0.018,
      unit: 'kg',
    },
  });

  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: icedLatte.id,
        ingredientId: milk.id,
      },
    },
    update: {},
    create: {
      menuItemId: icedLatte.id,
      ingredientId: milk.id,
      quantityRequired: 0.2,
      unit: 'L',
    },
  });

  // Iced Americano recipe: 18g coffee beans
  await prisma.recipe.upsert({
    where: {
      menuItemId_ingredientId: {
        menuItemId: icedAmericano.id,
        ingredientId: coffeeBeans.id,
      },
    },
    update: {},
    create: {
      menuItemId: icedAmericano.id,
      ingredientId: coffeeBeans.id,
      quantityRequired: 0.018,
      unit: 'kg',
    },
  });

  console.log('Created recipes');

  // Initialize inventory for branches
  for (const branch of [branch1, branch2]) {
    for (const ingredient of ingredients) {
      await prisma.branchInventory.upsert({
        where: {
          branchId_ingredientId: {
            branchId: branch.id,
            ingredientId: ingredient.id,
          },
        },
        update: {},
        create: {
          branchId: branch.id,
          ingredientId: ingredient.id,
          currentStock: 100, // Initial stock
        },
      });
    }
  }

  console.log('Initialized inventory for branches');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
