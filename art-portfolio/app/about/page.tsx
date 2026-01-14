import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 bg-white border-b border-border">
        <div className="container-custom">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-accent mb-4">
            About the Artist
          </h1>
          <p className="text-text-light text-lg max-w-3xl">
            Exploring the intersection of color, form, and emotion through contemporary fine art
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            {/* Artist Image */}
            <div className="relative w-full aspect-[4/3] mb-12 rounded-lg overflow-hidden bg-border-light">
              <Image
                src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80"
                alt="E DiFazio"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>

            {/* Biography */}
            <div className="prose prose-lg max-w-none space-y-6">
              <div className="text-text-light leading-relaxed space-y-4">
                <p className="text-xl font-light">
                  Welcome to my artistic journey. I am E DiFazio, a contemporary artist dedicated 
                  to creating works that bridge the gap between abstraction and representation, 
                  emotion and form, tradition and innovation.
                </p>

                <p>
                  My artistic practice is rooted in a deep appreciation for the natural world, 
                  urban landscapes, and the complex tapestry of human experience. Each piece I 
                  create is an exploration—an attempt to capture moments of beauty, tension, 
                  harmony, and contradiction that define our lived experiences.
                </p>

                <p>
                  Working primarily with acrylics, oils, and mixed media, I embrace both planned 
                  composition and spontaneous gesture. The process itself becomes part of the 
                  narrative, with layers of color and texture building upon one another to reveal 
                  unexpected harmonies and visual rhythms.
                </p>

                <h2 className="text-3xl font-serif font-semibold text-accent mt-12 mb-6">
                  Artistic Philosophy
                </h2>

                <p>
                  Art, to me, is a conversation—between the artist and the canvas, between the 
                  work and the viewer, between intention and discovery. I believe that the most 
                  compelling artworks are those that invite interpretation, that leave space for 
                  the viewer's own experiences and emotions to enter the dialogue.
                </p>

                <p>
                  My approach is characterized by a balance of control and surrender. I begin with 
                  an idea, a color palette, a mood, but allow the materials and the process to 
                  guide me toward the final form. This dance between intention and intuition results 
                  in works that feel both deliberate and organic, structured yet free.
                </p>

                <h2 className="text-3xl font-serif font-semibold text-accent mt-12 mb-6">
                  Techniques & Mediums
                </h2>

                <p>
                  My work spans multiple mediums, each chosen for its unique expressive potential:
                </p>

                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Painting:</strong> Acrylic and oil on canvas, exploring the full range 
                    of each medium's capabilities—from transparent washes to impasto texture
                  </li>
                  <li>
                    <strong>Drawing:</strong> Charcoal, graphite, and ink studies that capture 
                    gesture and form with precision and immediacy
                  </li>
                  <li>
                    <strong>Mixed Media:</strong> Combining traditional and unconventional materials 
                    to create layered, textural surfaces that invite close examination
                  </li>
                </ul>

                <h2 className="text-3xl font-serif font-semibold text-accent mt-12 mb-6">
                  Inspiration & Influences
                </h2>

                <p>
                  My artistic vision is shaped by a wide range of influences—from the color theories 
                  of the Impressionists to the bold abstractions of the mid-century modernists, from 
                  the organic forms found in nature to the geometric patterns of urban architecture.
                </p>

                <p>
                  Living in a world that moves at an ever-accelerating pace, I find myself drawn to 
                  moments of stillness, contemplation, and beauty. Whether it's the play of light 
                  through leaves, the rhythm of waves on a shore, or the energy of a city street, 
                  these everyday experiences become the raw material for artistic expression.
                </p>

                <h2 className="text-3xl font-serif font-semibold text-accent mt-12 mb-6">
                  Exhibitions & Recognition
                </h2>

                <p>
                  My work has been featured in galleries and exhibitions throughout the region, 
                  and I am grateful for the opportunity to share my artistic vision with collectors 
                  and art enthusiasts. Each piece that finds a home carries with it not just the 
                  work itself, but a connection to the creative process and the emotions that 
                  brought it into being.
                </p>

                <p className="mt-8 text-lg italic text-text-muted">
                  Thank you for taking the time to explore my work. I hope these pieces resonate 
                  with you and perhaps inspire your own moments of reflection and appreciation 
                  for the beauty that surrounds us.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-16 pt-12 border-t border-border text-center">
              <h3 className="text-2xl font-serif font-semibold text-accent mb-4">
                Interested in Commissioning a Piece?
              </h3>
              <p className="text-text-light mb-6">
                I welcome inquiries about custom commissions and available works
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white font-medium tracking-wide uppercase hover:bg-accent-light transition-colors rounded-sm"
              >
                Get in Touch
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

