'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Palette } from 'lucide-react';
import { artworkData } from '@/lib/artwork-data';
import ArtworkCard from '@/components/ArtworkCard';
import { useState } from 'react';
import Lightbox from '@/components/Lightbox';
import { Artwork } from '@/lib/types';

const featuredArtworks = artworkData.filter((art) => art.featured).slice(0, 3);

export default function HomePage() {
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleArtworkClick = (artwork: Artwork, index: number) => {
    setSelectedArtwork(artwork);
    setSelectedIndex(index);
  };

  const handleNext = () => {
    if (selectedArtwork && featuredArtworks.length > 0) {
      const nextIndex = (selectedIndex + 1) % featuredArtworks.length;
      setSelectedIndex(nextIndex);
      setSelectedArtwork(featuredArtworks[nextIndex]);
    }
  };

  const handlePrevious = () => {
    if (selectedArtwork && featuredArtworks.length > 0) {
      const prevIndex = (selectedIndex - 1 + featuredArtworks.length) % featuredArtworks.length;
      setSelectedIndex(prevIndex);
      setSelectedArtwork(featuredArtworks[prevIndex]);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background-200 via-background-100 to-background-50 opacity-50" />
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 inline-block">
              <Palette size={48} className="text-accent mx-auto" />
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-accent mb-6 animate-slide-up">
              E DiFazio Art
            </h1>
            <p className="text-xl md:text-2xl text-text-light mb-8 font-light leading-relaxed animate-slide-up animation-delay-200">
              Contemporary fine art celebrating expression, color, and form
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up animation-delay-400">
              <Link
                href="/gallery"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white font-medium tracking-wide uppercase hover:bg-accent-light transition-colors rounded-sm"
              >
                View Gallery
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-accent text-accent font-medium tracking-wide uppercase hover:bg-accent hover:text-white transition-colors rounded-sm"
              >
                About the Artist
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-accent/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-accent/50 rounded-full mt-2" />
          </div>
        </div>
      </section>

      {/* Featured Artwork Section */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-accent mb-4">
              Featured Works
            </h2>
            <p className="text-text-light max-w-2xl mx-auto">
              A curated selection of recent pieces showcasing diverse techniques and artistic vision
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {featuredArtworks.map((artwork, index) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onClick={() => handleArtworkClick(artwork, index)}
              />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/gallery"
              className="inline-flex items-center text-accent font-medium tracking-wide uppercase hover:text-accent-light transition-colors group"
            >
              View Full Gallery
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-accent mb-6">
                The Artist
              </h2>
              <p className="text-text-light text-lg leading-relaxed mb-6">
                Through a unique blend of contemporary techniques and timeless artistic principles, 
                each piece tells a story of exploration, emotion, and the beauty found in everyday moments.
              </p>
              <p className="text-text-light leading-relaxed mb-8">
                Drawing inspiration from nature, urban landscapes, and the human experience, 
                the work celebrates the interplay between form and color, inviting viewers to 
                discover their own meaning within each composition.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center text-accent font-medium tracking-wide uppercase hover:text-accent-light transition-colors group"
              >
                Learn More
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </div>
            <div className="relative aspect-square bg-border-light rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80"
                alt="Artist at work"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20 bg-accent text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
            Let's Connect
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Interested in commissioning a piece or have questions about available work? 
            I'd love to hear from you.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-accent font-medium tracking-wide uppercase hover:bg-background-100 transition-colors rounded-sm"
          >
            Get in Touch
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      <Lightbox
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
        onNext={handleNext}
        onPrevious={handlePrevious}
        hasNext={selectedIndex < featuredArtworks.length - 1}
        hasPrevious={selectedIndex > 0}
      />
    </>
  );
}

