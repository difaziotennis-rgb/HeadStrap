# Guide to Add Real Artwork from edifazioart.com

Since I cannot directly access the website, here's how to extract and add your actual artwork:

## Method 1: Manual Extraction (Recommended)

1. **Visit edifazioart.com** in your browser
2. **Open Developer Tools** (F12 or Cmd+Option+I on Mac)
3. **Go to Network tab** and filter by "Img" to see all images
4. **Right-click on artwork images** → "Copy image address" or "Save image as"
5. **Save images** to `/art-portfolio/public/images/` directory
6. **Note down** for each artwork:
   - Title
   - Medium (e.g., "Oil on Canvas", "Acrylic on Canvas")
   - Dimensions (e.g., "24" × 30"")
   - Year
   - Description
   - Category (painting, drawing, mixed-media)

## Method 2: Using Browser Console

Open the browser console on edifazioart.com and run:

```javascript
// This will extract all images from the page
const images = Array.from(document.querySelectorAll('img'));
const artworkData = images.map((img, index) => ({
  id: (index + 1).toString(),
  title: img.alt || `Artwork ${index + 1}`,
  imageUrl: img.src,
  // Add other details manually
}));
console.log(JSON.stringify(artworkData, null, 2));
```

## Method 3: Screenshot and Manual Entry

1. Take screenshots of the gallery page
2. Save artwork images to `public/images/`
3. Update `lib/artwork-data.ts` with the information

## Updating the Data File

Once you have the artwork information, edit `/art-portfolio/lib/artwork-data.ts`:

```typescript
{
  id: '1',
  title: 'Your Actual Title',
  medium: 'Your Medium',
  dimensions: 'Your Dimensions',
  year: 2024,
  category: 'painting', // or 'drawing', 'mixed-media'
  imageUrl: '/images/your-artwork.jpg', // or full URL if hosted elsewhere
  description: 'Your description',
  featured: true, // if you want it on homepage
}
```

## Image Hosting Options

- **Local**: Save to `public/images/` and use `/images/filename.jpg`
- **External**: Use full URL if images are hosted on CDN/external site
- **Cloud Storage**: Upload to Cloudinary, Imgur, or similar and use those URLs

