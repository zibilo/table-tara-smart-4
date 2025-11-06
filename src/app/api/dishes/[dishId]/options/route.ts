import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dishOptionGroups, dishOptions } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { dishId: string } }
) {
  try {
    const { dishId } = params;

    // Validate dishId is provided and not empty
    if (!dishId || dishId.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Dish ID is required',
          code: 'MISSING_DISH_ID' 
        },
        { status: 400 }
      );
    }

    // Query option groups for the dish, ordered by displayOrder
    const optionGroups = await db
      .select()
      .from(dishOptionGroups)
      .where(eq(dishOptionGroups.dishId, dishId))
      .orderBy(asc(dishOptionGroups.displayOrder));

    // Return 404 if no option groups found
    if (optionGroups.length === 0) {
      return NextResponse.json(
        { 
          error: 'No option groups found for this dish',
          code: 'NO_OPTION_GROUPS' 
        },
        { status: 404 }
      );
    }

    // Fetch options for each option group
    const optionGroupsWithOptions = await Promise.all(
      optionGroups.map(async (group) => {
        const options = await db
          .select()
          .from(dishOptions)
          .where(
            and(
              eq(dishOptions.optionGroupId, group.id),
              eq(dishOptions.isAvailable, true)
            )
          )
          .orderBy(asc(dishOptions.displayOrder));

        return {
          id: group.id,
          name: group.name,
          selectionType: group.selectionType,
          isRequired: group.isRequired,
          displayOrder: group.displayOrder,
          options: options.map(option => ({
            id: option.id,
            name: option.name,
            extraPrice: option.extraPrice,
            isAvailable: option.isAvailable,
            displayOrder: option.displayOrder
          }))
        };
      })
    );

    return NextResponse.json({
      optionGroups: optionGroupsWithOptions
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}