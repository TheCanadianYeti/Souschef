"use client";

import React, { useEffect, useState } from 'react';
import { fetchRecipes } from '../data/mockRecipes';
import RecipeCard from './RecipeCard';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: BACKEND INTEGRATION
    // Replace with: axios.get('/api/recipes').then(res => setRecipes(res.data));
    const loadRecipes = async () => {
      try {
        const data = await fetchRecipes();
        setRecipes(data);
      } catch (error) {
        console.error("Failed to load recipes", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecipes();
  }, []);

  return (
    <div className="animate-in fade-in duration-500 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Recipes</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and cook your favorite meals</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search recipes..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
          <Link 
            href="/capture"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary-500/30"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Recipe</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
