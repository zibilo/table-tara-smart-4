import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Add new customization tables
export const dishOptionGroups = sqliteTable('dish_option_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dishId: text('dish_id').notNull(),
  name: text('name').notNull(),
  selectionType: text('selection_type').notNull(),
  isRequired: integer('is_required', { mode: 'boolean' }).default(false),
  displayOrder: integer('display_order').default(0),
  createdAt: text('created_at').notNull(),
});

export const dishOptions = sqliteTable('dish_options', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  optionGroupId: integer('option_group_id').notNull().references(() => dishOptionGroups.id),
  name: text('name').notNull(),
  extraPrice: real('extra_price').default(0),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true),
  displayOrder: integer('display_order').default(0),
  createdAt: text('created_at').notNull(),
});