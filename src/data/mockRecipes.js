export const mockRecipes = [
  {
    id: '1',
    title: 'Spicy Garlic Noodles',
    description: 'A quick, deeply savory, and slightly spicy noodle dish perfect for a weeknight dinner.',
    source_type: 'video', // 'video', 'photo', 'url'
    source_url: 'https://tiktok.com/@chef/video/12345',
    servings: 2,
    cook_time: 15,
    prep_time: 5,
    difficulty: 'Easy',
    tags: ['Vegetarian', 'Quick', 'Asian'],
    image_url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { id: 'i1', name: 'Ramen noodles', quantity: '2', unit: 'packs', dietary_flags: [] },
      { id: 'i2', name: 'Garlic, minced', quantity: '4', unit: 'cloves', dietary_flags: [] },
      { id: 'i3', name: 'Soy sauce', quantity: '2', unit: 'tbsp', dietary_flags: ['contains-soy'] },
      { id: 'i4', name: 'Chili oil', quantity: '1', unit: 'tbsp', dietary_flags: [] },
      { id: 'i5', name: 'Green onions, sliced', quantity: '2', unit: 'stalks', dietary_flags: [] },
    ],
    steps: [
      { id: 's1', step_number: 1, instruction: 'Boil the ramen noodles according to package instructions. Drain and set aside.', duration_seconds: 180 },
      { id: 's2', step_number: 2, instruction: 'In a pan, heat up oil and sauté the minced garlic until fragrant (about 1 minute).', duration_seconds: 60 },
      { id: 's3', step_number: 3, instruction: 'Add soy sauce, chili oil, and a splash of water to the pan. Simmer for 2 minutes.', duration_seconds: 120 },
      { id: 's4', step_number: 4, instruction: 'Toss the cooked noodles in the sauce until evenly coated. Garnish with green onions and serve.', duration_seconds: 0 }
    ]
  },
  {
    id: '2',
    title: 'Avocado Toast with Poached Egg',
    description: 'The classic breakfast staple with a perfectly runny poached egg.',
    source_type: 'url',
    source_url: 'https://example-blog.com/avocado-toast',
    servings: 1,
    cook_time: 5,
    prep_time: 5,
    difficulty: 'Medium',
    tags: ['Breakfast', 'Vegetarian', 'Healthy'],
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    ingredients: [
      { id: 'i6', name: 'Sourdough bread', quantity: '1', unit: 'slice', dietary_flags: ['contains-gluten'] },
      { id: 'i7', name: 'Avocado', quantity: '0.5', unit: 'whole', dietary_flags: [] },
      { id: 'i8', name: 'Egg', quantity: '1', unit: 'whole', dietary_flags: [] },
      { id: 'i9', name: 'Everything bagel seasoning', quantity: '1', unit: 'tsp', dietary_flags: [] },
    ],
    steps: [
      { id: 's5', step_number: 1, instruction: 'Toast the sourdough bread to your desired crispiness.', duration_seconds: 120 },
      { id: 's6', step_number: 2, instruction: 'Mash the avocado with a fork and spread it evenly over the toast.', duration_seconds: 0 },
      { id: 's7', step_number: 3, instruction: 'Poach the egg in gently simmering water for 3 minutes.', duration_seconds: 180 },
      { id: 's8', step_number: 4, instruction: 'Place the poached egg on top of the avocado and sprinkle with seasoning.', duration_seconds: 0 }
    ]
  }
];

export const getLocalRecipes = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('custom_recipes');
    if (saved) return JSON.parse(saved);
  }
  return [];
};

export const saveLocalRecipe = (recipe) => {
  if (typeof window !== 'undefined') {
    const saved = getLocalRecipes();
    saved.push(recipe);
    localStorage.setItem('custom_recipes', JSON.stringify(saved));
  }
};

// TODO: BACKEND INTEGRATION - Replace these mock functions with actual Axios/fetch calls to Node.js backend.
export const fetchRecipes = async () => {
  return new Promise((resolve) => setTimeout(() => resolve([...mockRecipes, ...getLocalRecipes()]), 800));
};

export const fetchRecipeById = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const allRecipes = [...mockRecipes, ...getLocalRecipes()];
      const recipe = allRecipes.find(r => String(r.id) === String(id));
      resolve(recipe);
    }, 500);
  });
};
