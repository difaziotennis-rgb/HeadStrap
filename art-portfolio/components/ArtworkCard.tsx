'use client';

import Image from 'next/image';
import { Artwork } from '@/lib/types';
import { useState } from 'react';
import { Eye } from 'lucide-react';

interface ArtworkCardProps {
  artwork: Artwork;
  onClick: () => void;
}

export default function ArtworkCard({ artwork, onClick }: ArtworkCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative overflow-hidden bg-border-light aspect-[4/5] mb-4">
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          className={`artwork-image object-cover transition-all duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-border animate-pulse" />
        )}
        
        {/* Overlay on hover */}
        <div
          className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="text-white text-center">
            <Eye size={32} className="mx-auto mb-2" />
            <p className="text-sm font-medium">View Details</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-semibold text-accent group-hover:text-accent-light transition-colors">
          {artwork.title}
        </h3>
        <p className="text-sm text-text-light">{artwork.medium}</p>
        <p className="text-xs text-text-muted">
          {artwork.dimensions} • {artwork.year}
        </p>
      </div>
    </div>
  );
}

