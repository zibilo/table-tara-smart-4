import { db } from '@/db';
import { dishes } from '@/db/schema';

async function main() {
    const sampleDishes = [
        {
            name: 'Hamburger Classique',
            description: 'Un délicieux hamburger avec pain, viande, salade, tomate, oignon et sauce',
            price: 5000,
            category: 'plats',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    const insertedDishes = await db.insert(dishes).values(sampleDishes).returning();
    
    console.log('✅ Dishes seeder completed successfully');
    console.log('📝 Inserted dish ID:', insertedDishes[0].id);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});