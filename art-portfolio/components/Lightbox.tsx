'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Artwork } from '@/lib/types';

interface LightboxProps {
  artwork: Artwork | null;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function Lightbox({
  artwork,
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
}: LightboxProps) {
  useEffect(() => {
    if (artwork) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [artwork]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && artwork) {
        onClose();
      }
    };

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!artwork) return;
      if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious();
      }
      if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleArrowKeys);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleArrowKeys);
    };
  }, [artwork, onClose, onNext, onPrevious, hasNext, hasPrevious]);

  if (!artwork) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close"
        >
          <X size={32} />
        </button>

        {/* Navigation Buttons */}
        {hasPrevious && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2"
            aria-label="Previous artwork"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2"
            aria-label="Next artwork"
          >
            <ChevronRight size={32} />
          </button>
        )}

        {/* Image */}
        <div className="relative flex-1 bg-black rounded-lg overflow-hidden mb-4">
          <Image
            src={artwork.imageUrl}
            alt={artwork.title}
            fill
            className="object-contain"
            sizes="90vw"
            priority
          />
        </div>

        {/* Artwork Info */}
        <div className="bg-white rounded-lg p-6 text-text">
          <h2 className="text-2xl font-serif font-semibold mb-2">
            {artwork.title}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-text-muted mb-1">Medium</p>
              <p className="font-medium">{artwork.medium}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Dimensions</p>
              <p className="font-medium">{artwork.dimensions}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Year</p>
              <p className="font-medium">{artwork.year}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">Category</p>
              <p className="font-medium capitalize">{artwork.category.replace('-', ' ')}</p>
            </div>
          </div>
          {artwork.description && (
            <p className="text-text-light leading-relaxed">{artwork.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

