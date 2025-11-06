import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dishOptionGroups } from '@/db/schema';
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

    const optionGroupId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { dishId, name, selectionType, isRequired, displayOrder } = body;

    // Validate selectionType if provided
    if (selectionType !== undefined) {
      if (selectionType !== 'single' && selectionType !== 'multiple') {
        return NextResponse.json(
          {
            error: 'Selection type must be "single" or "multiple"',
            code: 'INVALID_SELECTION_TYPE',
          },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (dishId !== undefined) updateData.dishId = dishId;
    if (name !== undefined) updateData.name = name;
    if (selectionType !== undefined) updateData.selectionType = selectionType;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    // Update the option group
    const updated = await db
      .update(dishOptionGroups)
      .set(updateData)
      .where(eq(dishOptionGroups.id, optionGroupId))
      .returning();

    // Check if record exists
    if (updated.length === 0) {
      return NextResponse.json(
        {
          error: 'Option group not found',
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

    const optionGroupId = parseInt(id);

    // Delete the option group
    const deleted = await db
      .delete(dishOptionGroups)
      .where(eq(dishOptionGroups.id, optionGroupId))
      .returning();

    // Check if record exists
    if (deleted.length === 0) {
      return NextResponse.json(
        {
          error: 'Option group not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Option group deleted successfully',
        id: optionGroupId,
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