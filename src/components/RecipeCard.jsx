"use client";

import React from 'react';
import Link from 'next/link';
import { Clock, Users, PlayCircle, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function RecipeCard({ recipe }) {
  const getSourceIcon = () => {
    // White text always works against the dark image overlay
    switch (recipe.source_type) {
      case 'video': return <PlayCircle size={16} className="text-white" />;
      case 'url': return <LinkIcon size={16} className="text-white" />;
      default: return <ImageIcon size={16} className="text-white" />;
    }
  };

  return (
    // flex-col so the card body can grow and push the button to the bottom
    <div className="group rounded-2xl overflow-hidden glass border border-border-color hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Fixed-height image */}
      <div className="relative h-48 w-full overflow-hidden shrink-0">
        <img
          src={recipe.image_url || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'}
          alt={recipe.title}
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop
            e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-ink/50 dark:bg-bg-color/70 backdrop-blur-md rounded-full p-2">
          {getSourceIcon()}
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          {recipe.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-xs font-medium px-2 py-1 bg-badge-bg text-badge-text rounded-full backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* flex-col + flex-1 so this section fills remaining card height */}
      <div className="p-5 bg-card-bg flex flex-col flex-1">
        <h3 className="text-lg font-bold mb-2 line-clamp-1 text-text-primary group-hover:text-accent-color transition-colors">
          {recipe.title}
        </h3>

        {/* line-clamp-2 keeps heights consistent; flex-1 pushes footer down */}
        <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between text-sm text-text-secondary pt-4 border-t border-border-color">
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-accent-color" />
            <span>{recipe.prep_time + recipe.cook_time}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={16} className="text-accent-color" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* mt-auto guarantees this button is always at the card bottom */}
        <Link
          href={`/recipe/${recipe.id}`}
          className="mt-4 block w-full py-2 px-4 bg-accent-color text-page hover:opacity-80 rounded-xl text-center font-semibold transition-opacity duration-300"
        >
          View Recipe
        </Link>
      </div>
    </div>
  );
}