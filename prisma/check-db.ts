import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany();
  const ingredients = await prisma.ingredient.findMany();

  console.log('Branches:', branches.length);
  console.log('Branch IDs:', branches.map(b => ({ name: b.branchName, id: b.id })));
  console.log('\nIngredients:', ingredients.length);
  console.log('Ingredient IDs:', ingredients.map(i => ({ name: i.name, id: i.id })));

  // Try to create a simple inventory record
  if (branches.length > 0 && ingredients.length > 0) {
    console.log('\n\nTrying to create BranchInventory...');
    try {
      const inv = await prisma.branchInventory.create({
        data: {
          branchId: branches[0].id,
          ingredientId: ingredients[0].id,
          currentStock: 50,
        },
      });
      console.log('Success! Created inventory:', inv.id);
    } catch (error: any) {
      console.error('Failed:', error.message);
      console.error('Code:', error.code);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
