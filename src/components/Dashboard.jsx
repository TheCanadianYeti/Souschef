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
  const [selectedTag, setSelectedTag] = useState(null);

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
                          recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag ? recipe.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(recipes.flatMap(r => r.tags)));

  return (
    <div className="animate-in fade-in duration-700 pt-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-ink tracking-tight">Your Recipes</h1>
          <p className="text-warm-dark opacity-70">Manage and cook your favorite meals</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-grow md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-dark/40" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..." 
              /* Updated input to use Parchment theme */
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-parchment-deep bg-surface-color text-ink focus:outline-none focus:ring-2 focus:ring-brick/20 focus:border-brick transition-all placeholder:text-warm-dark/30"
            />
          </div>
          <Link 
            href="/capture"
            /* Action button using Brick */
            className="flex items-center gap-2 px-5 py-2.5 bg-brick hover:bg-ink text-page rounded-xl font-semibold transition-all shadow-md shadow-brick/10 active:scale-95"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Recipe</span>
          </Link>
        </div>
      </div>

      {/* Filter Tags */}
      {!loading && allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <button 
            onClick={() => setSelectedTag(null)}
            className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all border ${!selectedTag ? 'bg-ink text-page border-ink' : 'bg-parchment border-parchment-deep text-warm-dark hover:border-brick'}`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-5 py-1.5 rounded-full text-sm font-bold transition-all border ${selectedTag === tag ? 'bg-brick text-page border-brick shadow-sm' : 'bg-parchment border-parchment-deep text-warm-dark hover:border-brick'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-2xl bg-parchment-deep animate-pulse opacity-20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
          
          {/* Empty State */}
          {filteredRecipes.length === 0 && (
            <div className="col-span-full py-20 text-center glass rounded-3xl border border-parchment-deep">
              <Search className="mx-auto mb-4 text-parchment-deep" size={48} />
              <p className="text-2xl font-bold text-ink mb-2">No recipes found</p>
              <p className="text-warm-dark opacity-60">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}