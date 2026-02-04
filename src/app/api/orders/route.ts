import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      branchId,
      cashierId,
      items,
      paymentMethod,
      orderNumber,
    } = body;

    // Validate request
    if (!branchId || !cashierId || !items || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Get next order number if not provided
    let finalOrderNumber = orderNumber;
    if (!finalOrderNumber) {
      const lastOrder = await db.order.findFirst({
        where: { branchId },
        orderBy: { orderNumber: 'desc' },
      });
      finalOrderNumber = (lastOrder?.orderNumber || 0) + 1;
    }

    // Get cashier info
    const cashier = await db.user.findUnique({
      where: { id: cashierId },
    });

    if (!cashier) {
      return NextResponse.json(
        { error: 'Cashier not found' },
        { status: 404 }
      );
    }

    // For cashiers, check if they have an open shift
    if (cashier.role === 'CASHIER') {
      const openShift = await db.shift.findFirst({
        where: {
          cashierId,
          isClosed: false,
        },
      });

      if (!openShift) {
        return NextResponse.json(
          { error: 'No active shift found. Please open a shift first.' },
          { status: 400 }
        );
      }

      // Verify that open shift is for the same branch
      if (openShift.branchId !== branchId) {
        return NextResponse.json(
          { error: 'Active shift is for a different branch' },
          { status: 400 }
        );
      }
    }

    // Calculate order totals and validate menu items
    let subtotal = 0;
    const orderItemsToCreate = [];
    const inventoryDeductions = [];

    for (const item of items) {
      // Get menu item
      const menuItem = await db.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: {
          recipes: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      if (!menuItem) {
        return NextResponse.json(
          { error: `Menu item not found: ${item.menuItemId}` },
          { status: 404 }
        );
      }

      if (!menuItem.isActive) {
        return NextResponse.json(
          { error: `Menu item ${menuItem.name} is not available` },
          { status: 400 }
      );
      }

      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;

      orderItemsToCreate.push({
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        subtotal: itemSubtotal,
        recipeVersion: menuItem.version,
      });

      // Calculate inventory deductions based on recipes
      for (const recipe of menuItem.recipes) {
        const totalDeduction = recipe.quantityRequired * item.quantity;
        inventoryDeductions.push({
          ingredientId: recipe.ingredient.id,
          ingredientName: recipe.ingredient.name,
          quantityChange: -totalDeduction,
          unit: recipe.unit,
        });
      }
    }

    const totalAmount = subtotal;

    // Get current shift for cashiers
    let currentShiftId = null;
    if (cashier.role === 'CASHIER') {
      const openShift = await db.shift.findFirst({
        where: {
          cashierId,
          isClosed: false,
        },
      });
      if (openShift) {
        currentShiftId = openShift.id;
      }
    }

    // Generate transaction hash for tamper detection
    const transactionHash = Buffer.from(
      `${branchId}-${finalOrderNumber}-${totalAmount}-${cashierId}-${Date.now()}`
    ).toString('base64');

    // Create order with inventory deduction
    const order = await db.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          id: `${branchId}-${finalOrderNumber}-${Date.now()}`,
          branchId,
          orderNumber: finalOrderNumber,
          orderTimestamp: new Date(),
          cashierId,
          subtotal,
          totalAmount,
          paymentMethod,
          transactionHash,
          synced: false,
          shiftId: currentShiftId,
        },
      });

      // Create order items
      for (const item of orderItemsToCreate) {
        await tx.orderItem.create({
          data: {
            ...item,
            orderId: newOrder.id,
          },
        });
      }

      // Deduct inventory and create transactions
      for (const deduction of inventoryDeductions) {
        // Get current inventory
        const inventory = await tx.branchInventory.findUnique({
          where: {
            branchId_ingredientId: {
              branchId,
              ingredientId: deduction.ingredientId,
            },
          },
        });

        const stockBefore = inventory?.currentStock || 0;
        const stockAfter = stockBefore + deduction.quantityChange;

        // Create or update inventory
        if (inventory) {
          await tx.branchInventory.update({
            where: { id: inventory.id },
            data: {
              currentStock: stockAfter,
              lastModifiedAt: new Date(),
            },
          });
        } else {
          await tx.branchInventory.create({
            data: {
              branchId,
              ingredientId: deduction.ingredientId,
              currentStock: stockAfter,
            },
          });
        }

        // Create inventory transaction record
        await tx.inventoryTransaction.create({
          data: {
            branchId,
            ingredientId: deduction.ingredientId,
            transactionType: 'SALE',
            quantityChange: deduction.quantityChange,
            stockBefore,
            stockAfter,
            orderId: newOrder.id,
            createdBy: cashierId,
          },
        });
      }

      return newOrder;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.totalAmount,
        transactionHash: order.transactionHash,
      },
      message: 'Order processed successfully',
    });
  } catch (error: any) {
    console.error('Order processing error:', error);

    return NextResponse.json(
      { error: 'Failed to process order', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const orders = await db.order.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { orderTimestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        items: true,
        cashier: {
          select: { username: true, name: true },
        },
      },
    });

    const total = await db.order.count({
      where: branchId ? { branchId } : undefined,
    });

    return NextResponse.json({
      orders,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + orders.length < total,
      },
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
