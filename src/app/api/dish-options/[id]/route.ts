import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dishOptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const dishOptionId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { optionGroupId, name, extraPrice, isAvailable, displayOrder } = body;

    // Validate optionGroupId if provided
    if (optionGroupId !== undefined) {
      if (typeof optionGroupId !== 'number' || isNaN(optionGroupId)) {
        return NextResponse.json(
          {
            error: 'Valid option group ID is required',
            code: 'INVALID_OPTION_GROUP_ID',
          },
          { status: 400 }
        );
      }
    }

    // Validate extraPrice if provided
    if (extraPrice !== undefined) {
      if (typeof extraPrice !== 'number' || isNaN(extraPrice)) {
        return NextResponse.json(
          {
            error: 'Valid extra price is required',
            code: 'INVALID_EXTRA_PRICE',
          },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (optionGroupId !== undefined) updates.optionGroupId = optionGroupId;
    if (name !== undefined) updates.name = name;
    if (extraPrice !== undefined) updates.extraPrice = extraPrice;
    if (isAvailable !== undefined) updates.isAvailable = isAvailable;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;

    // Update the dish option
    const updated = await db
      .update(dishOptions)
      .set(updates)
      .where(eq(dishOptions.id, dishOptionId))
      .returning();

    // Check if record was found and updated
    if (updated.length === 0) {
      return NextResponse.json(
        {
          error: 'Dish option not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const dishOptionId = parseInt(id);

    // Delete the dish option
    const deleted = await db
      .delete(dishOptions)
      .where(eq(dishOptions.id, dishOptionId))
      .returning();

    // Check if record was found and deleted
    if (deleted.length === 0) {
      return NextResponse.json(
        {
          error: 'Dish option not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Dish option deleted successfully',
        id: dishOptionId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + error.message,
      },
      { status: 500 }
    );
  }
}