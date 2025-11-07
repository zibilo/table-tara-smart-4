import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all categories from categories table
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (catError) throw catError;

    // Get all dishes with their categories
    const { data: dishes, error: dishError } = await supabase
      .from('dishes')
      .select('id, name, category')
      .limit(10);

    if (dishError) throw dishError;

    // Get all option groups with their categories
    const { data: optionGroups, error: optError } = await supabase
      .from('category_option_groups')
      .select('id, category, name');

    if (optError) throw optError;

    // Analyze the data
    const dishCategories = [...new Set(dishes?.map(d => d.category) || [])];
    const optionGroupCategories = [...new Set(optionGroups?.map(og => og.category) || [])];

    return NextResponse.json({
      success: true,
      data: {
        categories: categories || [],
        dishCategories,
        optionGroupCategories,
        dishes: dishes || [],
        optionGroups: optionGroups || [],
        analysis: {
          categoriesInDishes: dishCategories,
          categoriesInOptionGroups: optionGroupCategories,
          mismatch: dishCategories.filter(dc => !optionGroupCategories.includes(dc)),
        }
      }
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
