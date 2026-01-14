# E DiFazio Art Portfolio

A beautiful, modern, and fully responsive art portfolio website built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

✨ **Modern Design**
- Clean, minimalist aesthetic that puts artwork front and center
- Elegant typography using Playfair Display and Cormorant Garamond
- Smooth animations and transitions
- Fully responsive design for all devices

🎨 **Gallery Features**
- Filterable artwork gallery by category (Paintings, Drawings, Mixed Media)
- Lightbox viewer with keyboard navigation (arrow keys, ESC to close)
- High-quality image display with lazy loading
- Featured artwork section on homepage

📱 **User Experience**
- Sticky navigation with scroll effects
- Smooth scrolling and page transitions
- Mobile-friendly hamburger menu
- Accessible focus states and keyboard navigation

📄 **Pages**
- **Homepage**: Hero section, featured works, artist preview, contact CTA
- **Gallery**: Full portfolio with category filtering and lightbox
- **About**: Comprehensive artist biography and philosophy
- **Contact**: Contact form with validation and contact information

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the art portfolio directory:
```bash
cd art-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser

The site will automatically reload when you make changes to the code.

## Project Structure

```
art-portfolio/
├── app/
│   ├── about/          # About page
│   ├── contact/        # Contact page
│   ├── gallery/        # Gallery page
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/
│   ├── ArtworkCard.tsx # Artwork card component
│   ├── Footer.tsx      # Footer component
│   ├── Lightbox.tsx    # Image lightbox modal
│   └── Navigation.tsx  # Navigation component
├── lib/
│   ├── artwork-data.ts # Artwork data (replace with your actual artwork)
│   └── types.ts        # TypeScript types
└── public/
    └── images/         # Place your artwork images here
```

## Customization

### Adding Your Artwork

1. Add your artwork images to the `public/images/` directory
2. Update `lib/artwork-data.ts` with your actual artwork information:
   - Replace placeholder image URLs with your actual images
   - Update titles, mediums, dimensions, years, and descriptions
   - Add more artwork entries as needed

### Updating Content

- **About Page**: Edit `app/about/page.tsx` to add your personal story
- **Contact Information**: Update contact details in `app/contact/page.tsx` and `components/Footer.tsx`
- **Site Metadata**: Update SEO metadata in `app/layout.tsx`

### Styling

The site uses Tailwind CSS for styling. Customize colors, fonts, and spacing in:
- `tailwind.config.ts` - Theme configuration
- `app/globals.css` - Global styles and custom utilities

## Building for Production

```bash
npm run build
npm start
```

This creates an optimized production build that can be deployed to any hosting platform that supports Next.js (Vercel, Netlify, etc.).

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library (available for future enhancements)
- **Lucide React** - Beautiful icon library

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is private and proprietary.

## Support

For questions or issues, please contact info@edifazioart.com

