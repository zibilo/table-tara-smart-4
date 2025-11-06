import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dishOptions } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { optionGroupId, name, extraPrice, isAvailable, displayOrder } = body;

    // Validate required fields
    if (!optionGroupId) {
      return NextResponse.json(
        { 
          error: 'optionGroupId is required',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { 
          error: 'name is required and must be a non-empty string',
          code: 'MISSING_REQUIRED_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate optionGroupId is a valid integer
    const parsedOptionGroupId = parseInt(optionGroupId);
    if (isNaN(parsedOptionGroupId)) {
      return NextResponse.json(
        { 
          error: 'optionGroupId must be a valid integer',
          code: 'INVALID_OPTION_GROUP_ID'
        },
        { status: 400 }
      );
    }

    // Validate extraPrice if provided
    let validatedExtraPrice = 0;
    if (extraPrice !== undefined && extraPrice !== null) {
      validatedExtraPrice = parseFloat(extraPrice);
      if (isNaN(validatedExtraPrice)) {
        return NextResponse.json(
          { 
            error: 'extraPrice must be a valid number',
            code: 'INVALID_EXTRA_PRICE'
          },
          { status: 400 }
        );
      }
    }

    // Validate isAvailable if provided
    let validatedIsAvailable = true;
    if (isAvailable !== undefined && isAvailable !== null) {
      if (typeof isAvailable !== 'boolean') {
        return NextResponse.json(
          { 
            error: 'isAvailable must be a boolean',
            code: 'INVALID_IS_AVAILABLE'
          },
          { status: 400 }
        );
      }
      validatedIsAvailable = isAvailable;
    }

    // Validate displayOrder if provided
    let validatedDisplayOrder = 0;
    if (displayOrder !== undefined && displayOrder !== null) {
      validatedDisplayOrder = parseInt(displayOrder);
      if (isNaN(validatedDisplayOrder)) {
        return NextResponse.json(
          { 
            error: 'displayOrder must be a valid integer',
            code: 'INVALID_DISPLAY_ORDER'
          },
          { status: 400 }
        );
      }
    }

    // Create new dish option
    const newDishOption = await db.insert(dishOptions)
      .values({
        optionGroupId: parsedOptionGroupId,
        name: name.trim(),
        extraPrice: validatedExtraPrice,
        isAvailable: validatedIsAvailable,
        displayOrder: validatedDisplayOrder,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newDishOption[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}