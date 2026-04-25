"use client";

import React from 'react';
import Link from 'next/link';
import { Clock, Users, PlayCircle, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

export default function RecipeCard({ recipe }) {
  const getSourceIcon = () => {
    // Keeping these white for contrast against the image overlay
    switch(recipe.source_type) {
      case 'video': return <PlayCircle size={16} className="text-white" />;
      case 'url': return <LinkIcon size={16} className="text-white" />;
      default: return <ImageIcon size={16} className="text-white" />;
    }
  };

  return (
    <div className="group rounded-2xl overflow-hidden glass border border-parchment-deep hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={recipe.image_url} 
          alt={recipe.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-ink/50 backdrop-blur-md rounded-full p-2">
          {getSourceIcon()}
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          {recipe.tags.slice(0,2).map(tag => (
            /* Using #D8CCBC (Parchment Deep) for the tag background as per your contrast sheet */
            <span key={tag} className="text-xs font-medium px-2 py-1 bg-parchment-deep text-warm-dark rounded-full backdrop-blur-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="p-5">
        {/* Title uses 'ink' and hover uses 'brick' */}
        <h3 className="text-lg font-bold mb-2 line-clamp-1 text-ink group-hover:text-brick transition-colors">
          {recipe.title}
        </h3>
        
        {/* Body text uses 'warm-dark' */}
        <p className="text-sm text-warm-dark/80 line-clamp-2 mb-4">
          {recipe.description}
        </p>
        
        <div className="flex items-center justify-between text-sm text-warm-dark pt-4 border-t border-parchment-deep">
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-brick" />
            <span>{recipe.prep_time + recipe.cook_time}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={16} className="text-brick" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>

        {/* The 'View Recipe' button: Page text on Brick background for AAA contrast */}
        <Link 
          href={`/recipe/${recipe.id}`}
          className="mt-4 block w-full py-2 px-4 bg-brick text-page hover:bg-ink rounded-xl text-center font-semibold transition-colors duration-300"
        >
          View Recipe
        </Link>
      </div>
    </div>
  );
}