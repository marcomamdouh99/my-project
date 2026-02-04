import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      reason,
      userId,
    } = body;

    // Validate request
    if (!orderId || !reason || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the order to refund
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.isRefunded) {
      return NextResponse.json(
        { error: 'Order is already refunded' },
        { status: 400 }
      );
    }

    // Process refund with inventory restoration
    await db.$transaction(async (tx) => {
      // Mark order as refunded
      await tx.order.update({
        where: { id: orderId },
        data: {
          isRefunded: true,
          refundReason: reason,
        },
      });

      // Restore inventory for each item in the order
      for (const orderItem of order.items) {
        // Get recipes for the menu item
        const recipes = await tx.recipe.findMany({
          where: { menuItemId: orderItem.menuItemId },
          include: {
            ingredient: true,
          },
        });

        // Restore inventory based on recipes
        for (const recipe of recipes) {
          const quantityToRestore = recipe.quantityRequired * orderItem.quantity;

          // Get current inventory
          const inventory = await tx.branchInventory.findUnique({
            where: {
              branchId_ingredientId: {
                branchId: order.branchId,
                ingredientId: recipe.ingredientId,
              },
            },
          });

          if (inventory) {
            const stockBefore = inventory.currentStock;
            const stockAfter = stockBefore + quantityToRestore;

            // Update inventory
            await tx.branchInventory.update({
              where: { id: inventory.id },
              data: {
                currentStock: stockAfter,
                lastModifiedAt: new Date(),
              },
            });

            // Create refund transaction
            await tx.inventoryTransaction.create({
              data: {
                branchId: order.branchId,
                ingredientId: recipe.ingredientId,
                transactionType: 'REFUND',
                quantityChange: quantityToRestore,
                stockBefore,
                stockAfter,
                orderId: orderId,
                reason: `Refund for order: ${order.orderNumber}`,
                createdBy: userId,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} has been refunded`,
      refund: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason,
        totalAmount: order.totalAmount,
        refundAmount: order.totalAmount, // Full refund
      },
    });
  } catch (error: any) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process refund', details: error.message },
      { status: 500 }
    );
  }
}
