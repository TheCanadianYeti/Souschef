const { pool } = require('./index');
const bcrypt = require('bcryptjs');

const seedUsers = async () => {
    console.log('Seeding users...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
        {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'demo@mise.app',
            password_hash: hashedPassword,
            display_name: 'Demo User',
            dietary_restrictions: ['vegetarian'],
            preferences: JSON.stringify({
                theme: 'dark',
                units: 'metric',
                notifications: true
            })
        },
        {
            id: '22222222-2222-2222-2222-222222222222',
            email: 'chef@mise.app',
            password_hash: hashedPassword,
            display_name: 'Chef User',
            dietary_restrictions: [],
            preferences: JSON.stringify({
                theme: 'light',
                units: 'imperial',
                notifications: false
            })
        }
    ];

    for (const user of users) {
        await pool.query(
            `INSERT INTO users (id, email, password_hash, display_name, dietary_restrictions, preferences)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [user.id, user.email, user.password_hash, user.display_name, user.dietary_restrictions, user.preferences]
        );
    }

    console.log('Users seeded successfully');
};

const seedRecipes = async () => {
    console.log('Seeding recipes...');

    const recipes = [
        {
            id: '33333333-3333-3333-3333-333333333331',
            user_id: '11111111-1111-1111-1111-111111111111',
            title: 'Spicy Garlic Noodles',
            description: 'A quick, deeply savory, and slightly spicy noodle dish perfect for a weeknight dinner.',
            source_url: 'https://tiktok.com/@chef/video/12345',
            source_type: 'video',
            servings: 2,
            cook_time: 15,
            prep_time: 5,
            difficulty: 'Easy',
            tags: ['Vegetarian', 'Quick', 'Asian'],
            image_url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80',
            ingredients: [
                { name: 'Ramen noodles', quantity: '2', unit: 'packs', dietary_flags: [] },
                { name: 'Garlic, minced', quantity: '4', unit: 'cloves', dietary_flags: [] },
                { name: 'Soy sauce', quantity: '2', unit: 'tbsp', dietary_flags: ['contains-soy'] },
                { name: 'Chili oil', quantity: '1', unit: 'tbsp', dietary_flags: [] },
                { name: 'Green onions, sliced', quantity: '2', unit: 'stalks', dietary_flags: [] }
            ],
            steps: [
                { step_number: 1, instruction: 'Boil the ramen noodles according to package instructions. Drain and set aside.', duration_seconds: 180 },
                { step_number: 2, instruction: 'In a pan, heat up oil and sauté the minced garlic until fragrant (about 1 minute).', duration_seconds: 60 },
                { step_number: 3, instruction: 'Add soy sauce, chili oil, and a splash of water to the pan. Simmer for 2 minutes.', duration_seconds: 120 },
                { step_number: 4, instruction: 'Toss the cooked noodles in the sauce until evenly coated. Garnish with green onions and serve.', duration_seconds: 0 }
            ]
        },
        {
            id: '33333333-3333-3333-3333-333333333332',
            user_id: '11111111-1111-1111-1111-111111111111',
            title: 'Avocado Toast with Poached Egg',
            description: 'The classic breakfast staple with a perfectly runny poached egg.',
            source_url: 'https://example-blog.com/avocado-toast',
            source_type: 'url',
            servings: 1,
            cook_time: 5,
            prep_time: 5,
            difficulty: 'Medium',
            tags: ['Breakfast', 'Vegetarian', 'Healthy'],
            image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
            ingredients: [
                { name: 'Sourdough bread', quantity: '1', unit: 'slice', dietary_flags: ['contains-gluten'] },
                { name: 'Avocado', quantity: '0.5', unit: 'whole', dietary_flags: [] },
                { name: 'Egg', quantity: '1', unit: 'whole', dietary_flags: [] },
                { name: 'Everything bagel seasoning', quantity: '1', unit: 'tsp', dietary_flags: [] }
            ],
            steps: [
                { step_number: 1, instruction: 'Toast the sourdough bread to your desired crispiness.', duration_seconds: 120 },
                { step_number: 2, instruction: 'Mash the avocado with a fork and spread it evenly over the toast.', duration_seconds: 0 },
                { step_number: 3, instruction: 'Poach the egg in gently simmering water for 3 minutes.', duration_seconds: 180 },
                { step_number: 4, instruction: 'Place the poached egg on top of the avocado and sprinkle with seasoning.', duration_seconds: 0 }
            ]
        },
        {
            id: '33333333-3333-3333-3333-333333333333',
            user_id: '22222222-2222-2222-2222-222222222222',
            title: 'Classic Margherita Pizza',
            description: 'Simple yet delicious pizza with fresh mozzarella, tomatoes, and basil.',
            source_url: null,
            source_type: 'manual',
            servings: 4,
            cook_time: 15,
            prep_time: 120,
            difficulty: 'Hard',
            tags: ['Italian', 'Vegetarian', 'Dinner'],
            image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
            ingredients: [
                { name: 'Pizza dough', quantity: '500', unit: 'g', dietary_flags: ['contains-gluten'] },
                { name: 'San Marzano tomatoes', quantity: '400', unit: 'g', dietary_flags: [] },
                { name: 'Fresh mozzarella', quantity: '250', unit: 'g', dietary_flags: ['contains-dairy'] },
                { name: 'Fresh basil', quantity: '1', unit: 'bunch', dietary_flags: [] },
                { name: 'Olive oil', quantity: '2', unit: 'tbsp', dietary_flags: [] },
                { name: 'Salt', quantity: '1', unit: 'tsp', dietary_flags: [] }
            ],
            steps: [
                { step_number: 1, instruction: 'Prepare the pizza dough and let it rest for 2 hours at room temperature.', duration_seconds: 7200 },
                { step_number: 2, instruction: 'Preheat oven to maximum temperature (ideally 500°F/260°C) with a pizza stone if available.', duration_seconds: 1800 },
                { step_number: 3, instruction: 'Crush the San Marzano tomatoes by hand and season with salt.', duration_seconds: 120 },
                { step_number: 4, instruction: 'Stretch the dough into a 12-inch circle and transfer to a pizza peel.', duration_seconds: 300 },
                { step_number: 5, instruction: 'Spread tomato sauce, add torn mozzarella, and drizzle with olive oil.', duration_seconds: 120 },
                { step_number: 6, instruction: 'Bake for 10-15 minutes until crust is golden and cheese is bubbly.', duration_seconds: 900 },
                { step_number: 7, instruction: 'Top with fresh basil leaves and serve immediately.', duration_seconds: 0 }
            ]
        }
    ];

    for (const recipe of recipes) {
        // Insert recipe
        await pool.query(
            `INSERT INTO recipes (id, user_id, title, description, source_url, source_type, servings, cook_time, prep_time, difficulty, tags, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [recipe.id, recipe.user_id, recipe.title, recipe.description, recipe.source_url, recipe.source_type, recipe.servings, recipe.cook_time, recipe.prep_time, recipe.difficulty, recipe.tags, recipe.image_url]
        );

        // Insert ingredients
        for (let i = 0; i < recipe.ingredients.length; i++) {
            const ing = recipe.ingredients[i];
            await pool.query(
                `INSERT INTO ingredients (id, recipe_id, name, quantity, unit, dietary_flags, order_index)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
                 ON CONFLICT DO NOTHING`,
                [recipe.id, ing.name, ing.quantity, ing.unit, ing.dietary_flags, i]
            );
        }

        // Insert steps
        for (const step of recipe.steps) {
            await pool.query(
                `INSERT INTO cooking_steps (id, recipe_id, step_number, instruction, duration_seconds, order_index)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
                 ON CONFLICT DO NOTHING`,
                [recipe.id, step.step_number, step.instruction, step.duration_seconds, step.step_number - 1]
            );
        }
    }

    console.log('Recipes seeded successfully');
};

const seedGroceryList = async () => {
    console.log('Seeding grocery list...');

    const listResult = await pool.query(
        `INSERT INTO grocery_lists (id, user_id, name)
         VALUES (gen_random_uuid(), $1, 'My Grocery List')
         ON CONFLICT DO NOTHING
         RETURNING *`,
        ['11111111-1111-1111-1111-111111111111']
    );

    if (listResult.rows.length > 0) {
        const listId = listResult.rows[0].id;

        const items = [
            { name: 'Milk', quantity: '1', unit: 'gallon' },
            { name: 'Eggs', quantity: '12', unit: 'count' },
            { name: 'Bread', quantity: '1', unit: 'loaf' },
            { name: 'Butter', quantity: '1', unit: 'stick' }
        ];

        for (const item of items) {
            await pool.query(
                `INSERT INTO grocery_list_items (id, grocery_list_id, name, quantity, unit)
                 VALUES (gen_random_uuid(), $1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [listId, item.name, item.quantity, item.unit]
            );
        }
    }

    console.log('Grocery list seeded successfully');
};

const runSeeds = async () => {
    console.log('Running database seeds...');

    try {
        await seedUsers();
        await seedRecipes();
        await seedGroceryList();
        console.log('All seeds completed successfully!');
    } catch (error) {
        console.error('Error running seeds:', error);
        throw error;
    }
};

// Run if called directly
if (require.main === module) {
    runSeeds()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { runSeeds };