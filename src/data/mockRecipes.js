export const mockRecipes = [];

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

export const deleteLocalRecipe = (id) => {
  if (typeof window !== 'undefined') {
    const saved = getLocalRecipes();
    const updated = saved.filter(r => String(r.id) !== String(id));
    localStorage.setItem('custom_recipes', JSON.stringify(updated));
  }
};


// TODO: BACKEND INTEGRATION - Replace these mock functions with actual Axios/fetch calls to Node.js backend.
import axios from 'axios';

// Backend API Base URL
// Backend API Base URL - Robust handling of environment variables
const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  // Remove trailing slash if present
  url = url.replace(/\/$/, '');
  // Ensure /api is present if not local and not already there
  if (!url.includes('localhost') && !url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

export const fetchRecipes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/recipes`);
    const backendRecipes = response.data.data || [];
    return [...backendRecipes, ...getLocalRecipes()];
  } catch (error) {
    console.error('Error fetching recipes from backend:', error);
    return [...mockRecipes, ...getLocalRecipes()];
  }
};

export const fetchRecipeById = async (id) => {
  // If it's a local mock ID, handle it
  if (id.startsWith('local-')) {
    const allLocal = [...mockRecipes, ...getLocalRecipes()];
    return allLocal.find(r => String(r.id) === String(id));
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/recipes/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching recipe by ID:', error);
    // Fallback to local search if backend fails
    const allLocal = [...mockRecipes, ...getLocalRecipes()];
    return allLocal.find(r => String(r.id) === String(id));
  }
};
