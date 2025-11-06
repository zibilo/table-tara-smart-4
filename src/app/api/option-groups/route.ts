import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dishOptionGroups } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const dishId = searchParams.get('dishId');

    let query = db.select().from(dishOptionGroups);

    if (dishId) {
      query = query.where(eq(dishOptionGroups.dishId, dishId));
    }

    const results = await query
      .orderBy(asc(dishOptionGroups.displayOrder))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dishId, name, selectionType, isRequired, displayOrder } = body;

    if (!dishId || !name || !selectionType) {
      return NextResponse.json(
        {
          error: 'Missing required fields: dishId, name, and selectionType are required',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    if (typeof dishId !== 'string' || dishId.trim() === '') {
      return NextResponse.json(
        {
          error: 'dishId must be a non-empty string',
          code: 'INVALID_DISH_ID',
        },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        {
          error: 'name must be a non-empty string',
          code: 'INVALID_NAME',
        },
        { status: 400 }
      );
    }

    if (selectionType !== 'single' && selectionType !== 'multiple') {
      return NextResponse.json(
        {
          error: 'selectionType must be either "single" or "multiple"',
          code: 'INVALID_SELECTION_TYPE',
        },
        { status: 400 }
      );
    }

    const newOptionGroup = await db
      .insert(dishOptionGroups)
      .values({
        dishId: dishId.trim(),
        name: name.trim(),
        selectionType,
        isRequired: isRequired ?? false,
        displayOrder: displayOrder ?? 0,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newOptionGroup[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}