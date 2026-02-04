import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany();
  const menuItems = await prisma.menuItem.findMany({ where: { isActive: true } });
  const users = await prisma.user.findMany();
  const inventory = await prisma.branchInventory.findMany();

  console.log('=== Database State ===\n');
  console.log('Branches:', branches.length);
  branches.forEach(b => {
    console.log(`  - ${b.branchName} (ID: ${b.id})`);
  });

  console.log('\nMenu Items:', menuItems.length);
  menuItems.forEach(m => {
    console.log(`  - ${m.name} (${m.category}) - ${m.price.toFixed(2)}`);
  });

  console.log('\nUsers:', users.length);
  users.forEach(u => {
    console.log(`  - ${u.username} (${u.role})`);
  });

  console.log('\nInventory Records:', inventory.length);
  const ingredients = await prisma.ingredient.findMany();
  const branchStock = new Map();
  inventory.forEach(inv => {
    const branch = branches.find(b => b.id === inv.branchId);
    const ingredient = ingredients.find(i => i.id === inv.ingredientId);
    if (branch && ingredient) {
      const key = branch.branchName;
      if (!branchStock.has(key)) {
        branchStock.set(key, []);
      }
      branchStock.get(key)!.push(`${ingredient.name}: ${inv.currentStock} ${ingredient.unit}`);
    }
  });

  branchStock.forEach((items, branchName) => {
    console.log(`\n${branchName}:`);
    items.forEach(item => console.log(`  - ${item}`));
  });

  await prisma.$disconnect();
}

main().catch(console.error);
