export interface Artwork {
  id: string;
  title: string;
  medium: string;
  dimensions: string;
  year: number;
  category: 'painting' | 'drawing' | 'mixed-media' | 'all';
  imageUrl: string;
  description?: string;
  featured?: boolean;
}

export interface Category {
  id: string;
  label: string;
  value: Artwork['category'];
}

