import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Shared update logic to avoid double-reading of body
async function closeShift(id: string, body: any) {
  const { closingCash, notes } = body;

  console.log('[closeShift] Shift ID:', id, 'Closing Cash:', closingCash);

  if (!closingCash) {
    return { error: 'Closing cash is required', status: 400 };
  }

  // Get the shift first
  const shift = await db.shift.findUnique({
    where: { id },
    include: {
      cashier: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  if (!shift) {
    console.log('[closeShift] Shift not found');
    return { error: 'Shift not found', status: 404 };
  }

  // Calculate actual closing figures from orders
  const orderStats = await db.order.aggregate({
    where: {
      shiftId: id,
    },
    _count: true,
    _sum: {
      totalAmount: true,
    },
  });

  console.log('[closeShift] Order stats:', {
    orders: orderStats._count,
    revenue: orderStats._sum.totalAmount || 0,
  });

  // Update shift with calculated closing data
  const updatedShift = await db.shift.update({
    where: { id },
    data: {
      closingCash: parseFloat(closingCash),
      endTime: new Date(),
      isClosed: true,
      closingOrders: orderStats._count,
      closingRevenue: orderStats._sum.totalAmount || 0,
      notes,
    },
  });

  console.log('[closeShift] Shift updated successfully');

  return {
    success: true,
    shift: updatedShift,
    message: 'Shift closed successfully',
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[PATCH /api/shifts/[id]] Request received');

    // In Next.js 16, params is a Promise and must be awaited
    const { id } = await params;

    const body = await request.json();

    const result = await closeShift(id, body);

    if (result.status) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[PATCH /api/shifts/[id]] Error closing shift:', error);
    return NextResponse.json(
      { error: 'Failed to close shift', details: error.message },
      { status: 500 }
    );
  }
}

// Workaround for gateway that blocks PATCH requests
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[POST /api/shifts/[id]] Request received (PATCH override)');

    // In Next.js 16, params is a Promise and must be awaited
    const { id } = await params;

    const body = await request.json();

    // Check if this is a PATCH override
    if (body._method !== 'PATCH') {
      return NextResponse.json(
        { error: 'Invalid method' },
        { status: 405 }
      );
    }

    const result = await closeShift(id, body);

    if (result.status) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[POST /api/shifts/[id]] Error closing shift:', error);
    return NextResponse.json(
      { error: 'Failed to close shift', details: error.message },
      { status: 500 }
    );
  }
}
