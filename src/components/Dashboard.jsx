"use client";

import React, { useEffect, useState } from 'react';
import { fetchRecipes } from '../data/mockRecipes';
import RecipeCard from './RecipeCard';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
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

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // Multi-tag filtering: recipe must match ALL selected tags (AND logic)
    const matchesTags = selectedTags.length > 0 
      ? selectedTags.every(tag => recipe.tags && recipe.tags.includes(tag)) 
      : true;
      
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const allTags = Array.from(new Set(recipes.flatMap(r => r.tags)));

  return (
    <div className="animate-in fade-in duration-700 pt-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-text-primary tracking-tight">Your Recipes</h1>
          <p className="text-text-secondary opacity-70">Manage and cook your favorite meals</p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-grow md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-input-border bg-input-bg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color/20 focus:border-accent-color transition-all placeholder:text-text-muted"
            />
          </div>
          <Link
            href="/capture"
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-color hover:opacity-80 text-page rounded-xl font-semibold transition-all shadow-md shadow-accent-color/10 active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Recipe</span>
          </Link>
        </div>
      </div>

      {/* Filter Tags */}
      {!loading && allTags.length > 0 && (
        <div className="overflow-x-auto mb-10 pb-4 custom-scrollbar">
          <div className="grid grid-rows-2 grid-flow-col gap-2 min-w-max">
          <button
            onClick={() => setSelectedTags([])}
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all border ${
              selectedTags.length === 0
                ? 'bg-text-primary text-page border-text-primary'
                : 'bg-surface-color border-border-color text-text-secondary hover:border-accent-color'
            }`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all border ${
                selectedTags.includes(tag)
                  ? 'bg-accent-color text-page border-accent-color shadow-sm'
                  : 'bg-surface-color border-border-color text-text-secondary hover:border-accent-color'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Grid Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-surface-color border border-border-color animate-pulse opacity-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}

          {/* Empty State */}
          {filteredRecipes.length === 0 && (
            <div className="col-span-full py-20 text-center glass rounded-3xl border border-border-color">
              <Search className="mx-auto mb-4 text-text-muted" size={48} />
              <p className="text-2xl font-bold text-text-primary mb-2">No recipes found</p>
              <p className="text-text-secondary opacity-60">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}