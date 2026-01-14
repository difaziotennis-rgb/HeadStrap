'use client';

import { useState, useMemo } from 'react';
import { artworkData, categories } from '@/lib/artwork-data';
import ArtworkCard from '@/components/ArtworkCard';
import Lightbox from '@/components/Lightbox';
import { Artwork } from '@/lib/types';

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<Artwork['category']>('all');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredArtworks = useMemo(() => {
    if (selectedCategory === 'all') {
      return artworkData;
    }
    return artworkData.filter((art) => art.category === selectedCategory);
  }, [selectedCategory]);

  const handleArtworkClick = (artwork: Artwork) => {
    const index = filteredArtworks.findIndex((a) => a.id === artwork.id);
    setSelectedIndex(index);
    setSelectedArtwork(artwork);
  };

  const handleNext = () => {
    if (selectedArtwork && filteredArtworks.length > 0) {
      const nextIndex = (selectedIndex + 1) % filteredArtworks.length;
      setSelectedIndex(nextIndex);
      setSelectedArtwork(filteredArtworks[nextIndex]);
    }
  };

  const handlePrevious = () => {
    if (selectedArtwork && filteredArtworks.length > 0) {
      const prevIndex = (selectedIndex - 1 + filteredArtworks.length) % filteredArtworks.length;
      setSelectedIndex(prevIndex);
      setSelectedArtwork(filteredArtworks[prevIndex]);
    }
  };

  return (
    <div className="pt-20">
      {/* Header */}
      <section className="py-12 bg-white border-b border-border">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-accent mb-4">
            Gallery
          </h1>
          <p className="text-text-light text-lg max-w-2xl">
            Explore the complete collection of works, from paintings and drawings to mixed media pieces
          </p>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 bg-background sticky top-20 z-40 border-b border-border">
        <div className="container-custom">
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-6 py-2 text-sm font-medium tracking-wide uppercase transition-colors rounded-sm ${
                  selectedCategory === category.value
                    ? 'bg-accent text-white'
                    : 'bg-white text-text-light hover:text-accent border border-border'
                }`}
              >
                {category.label}
                {category.value !== 'all' && (
                  <span className="ml-2 text-xs opacity-75">
                    ({artworkData.filter((a) => a.category === category.value).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Artwork Grid */}
      <section className="py-12 bg-background min-h-screen">
        <div className="container-custom">
          {filteredArtworks.length > 0 ? (
            <>
              <div className="mb-6 text-text-light text-sm">
                Showing {filteredArtworks.length} {filteredArtworks.length === 1 ? 'piece' : 'pieces'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArtworks.map((artwork) => (
                  <ArtworkCard
                    key={artwork.id}
                    artwork={artwork}
                    onClick={() => handleArtworkClick(artwork)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-text-light text-lg">
                No artworks found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        onNext={handleNext}
        onPrevious={handlePrevious}
        hasNext={selectedIndex < filteredArtworks.length - 1}
        hasPrevious={selectedIndex > 0}
      />
    </div>
  );
}

