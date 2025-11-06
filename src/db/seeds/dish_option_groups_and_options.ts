import { db } from '@/db';
import { dishOptionGroups, dishOptions } from '@/db/schema';

async function main() {
    const timestamp = new Date().toISOString();
    const dishId = 'hamburger-classique-001';

    // Step 1: Insert option groups and capture their IDs
    const optionGroupsData = [
        {
            dishId: dishId,
            name: 'Cuisson de la Viande',
            selectionType: 'single',
            isRequired: true,
            displayOrder: 0,
            createdAt: timestamp,
        },
        {
            dishId: dishId,
            name: 'Choisissez votre Sauce',
            selectionType: 'single',
            isRequired: false,
            displayOrder: 1,
            createdAt: timestamp,
        },
        {
            dishId: dishId,
            name: 'Ajouter des Suppléments',
            selectionType: 'multiple',
            isRequired: false,
            displayOrder: 2,
            createdAt: timestamp,
        },
        {
            dishId: dishId,
            name: 'Retirer des Ingrédients',
            selectionType: 'multiple',
            isRequired: false,
            displayOrder: 3,
            createdAt: timestamp,
        },
    ];

    const insertedOptionGroups = await db.insert(dishOptionGroups).values(optionGroupsData).returning();

    // Step 2: Create options for each option group
    const optionsData = [
        // Cuisson de la Viande options (Option Group 1)
        {
            optionGroupId: insertedOptionGroups[0].id,
            name: 'Saignant',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 0,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[0].id,
            name: 'À point',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 1,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[0].id,
            name: 'Bien cuit',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 2,
            createdAt: timestamp,
        },
        // Choisissez votre Sauce options (Option Group 2)
        {
            optionGroupId: insertedOptionGroups[1].id,
            name: 'Mayonnaise',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 0,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[1].id,
            name: 'Ketchup',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 1,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[1].id,
            name: 'Moutarde',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 2,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[1].id,
            name: 'Sauce BBQ',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 3,
            createdAt: timestamp,
        },
        // Ajouter des Suppléments options (Option Group 3)
        {
            optionGroupId: insertedOptionGroups[2].id,
            name: 'Bacon',
            extraPrice: 500,
            isAvailable: true,
            displayOrder: 0,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[2].id,
            name: 'Œuf',
            extraPrice: 300,
            isAvailable: true,
            displayOrder: 1,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[2].id,
            name: 'Fromage',
            extraPrice: 400,
            isAvailable: true,
            displayOrder: 2,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[2].id,
            name: 'Avocat',
            extraPrice: 350,
            isAvailable: true,
            displayOrder: 3,
            createdAt: timestamp,
        },
        // Retirer des Ingrédients options (Option Group 4)
        {
            optionGroupId: insertedOptionGroups[3].id,
            name: 'Oignon',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 0,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[3].id,
            name: 'Tomate',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 1,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[3].id,
            name: 'Cornichons',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 2,
            createdAt: timestamp,
        },
        {
            optionGroupId: insertedOptionGroups[3].id,
            name: 'Salade',
            extraPrice: 0,
            isAvailable: true,
            displayOrder: 3,
            createdAt: timestamp,
        },
    ];

    await db.insert(dishOptions).values(optionsData);

    console.log('✅ Dish option groups and options seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});