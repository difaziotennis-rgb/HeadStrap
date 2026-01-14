# Quick Start Guide

## Starting the Development Server

To start the art portfolio site locally, simply run:

```bash
cd art-portfolio
npm run dev
```

The site will be available at **http://localhost:3001**

## What's Included

✅ **Homepage** - Hero section with featured artworks and artist preview
✅ **Gallery** - Filterable portfolio with lightbox viewer
✅ **About** - Comprehensive artist biography page
✅ **Contact** - Contact form and information

## Next Steps

1. **Replace Placeholder Images**: 
   - Add your actual artwork images to `public/images/`
   - Update image URLs in `lib/artwork-data.ts`

2. **Customize Content**:
   - Update artist bio in `app/about/page.tsx`
   - Update contact information in `app/contact/page.tsx`
   - Update metadata in `app/layout.tsx`

3. **Add Your Artwork**:
   - Edit `lib/artwork-data.ts` with your actual pieces
   - Add images to `public/images/` directory
   - Update categories as needed

## Design Features

- **Modern, Clean Design** - Minimalist aesthetic that showcases your art
- **Fully Responsive** - Looks great on all devices
- **Smooth Animations** - Elegant transitions and interactions
- **Fast Loading** - Optimized images and code
- **SEO Ready** - Proper metadata and structure

## Port Information

The art portfolio runs on port **3001** to avoid conflicts with other Next.js projects that may run on port 3000.

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed: `npm install`
2. Check that port 3001 is not already in use
3. Clear the Next.js cache: `rm -rf .next` then `npm run dev`
4. Check for any error messages in the terminal

Enjoy your new art portfolio website! 🎨

