import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtCheckoutButton } from "@/components/art/ArtCheckoutButton";
import { artPieces, formatUsd, getArtPieceBySlug } from "@/lib/art/catalog";
import { ART_SITE } from "@/lib/art/site";

type Props = {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export function generateStaticParams() {
  return artPieces.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: Props) {
  const piece = getArtPieceBySlug(params.slug);
  if (!piece) return { title: "Artwork" };
  return {
    title: piece.title,
    description: `${piece.title} — ${formatUsd(piece.priceUsd)} · E. DiFazio Art`,
    openGraph: {
      title: piece.title,
      description: `${formatUsd(piece.priceUsd)} · ${piece.category}`,
    },
  };
}

export default function ArtPiecePage({ params, searchParams }: Props) {
  const piece = getArtPieceBySlug(params.slug);
  if (!piece) notFound();

  const available = piece.availability === "available";
  const cancelled =
    typeof searchParams.cancelled === "string"
      ? searchParams.cancelled === "1"
      : Array.isArray(searchParams.cancelled)
        ? searchParams.cancelled.includes("1")
        : false;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <Link
          href="/art/shop"
          className="text-[13px] text-mcm-charcoal-600/80 border-b border-mcm-charcoal-500/15 pb-px transition hover:border-mcm-charcoal-500/35"
        >
          Collection
        </Link>

        {cancelled && (
          <p className="mt-4 text-[13px] leading-relaxed text-mcm-brown-600/75">
            Checkout cancelled. No charge was made.
          </p>
        )}

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-3">
            <div className="relative aspect-[4/5] overflow-hidden border border-mcm-cream-200/70 bg-mcm-cream-100/80 lg:aspect-square">
              {piece.images[0] ? (
                <Image
                  src={piece.images[0]}
                  alt={piece.title}
                  fill
                  className="object-contain"
                  priority
                  unoptimized
                />
              ) : null}
            </div>
            {piece.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {piece.images.slice(1, 5).map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden rounded-md border border-mcm-cream-200 bg-mcm-cream-100">
                    <Image src={src} alt="" fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-normal uppercase tracking-[0.28em] text-mcm-brown-600/75">
              {piece.category}
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-mcm-charcoal-500 sm:text-4xl">
              {piece.title}
            </h1>
            <p className="mt-4 text-2xl font-light text-mcm-charcoal-600">
              {available ? formatUsd(piece.priceUsd) : <span className="text-mcm-brown-600/80">Sold — {formatUsd(piece.priceUsd)}</span>}
            </p>

            {available ? (
              <div className="mt-10 border border-mcm-cream-200/70 bg-white/70 p-6">
                <ArtCheckoutButton slug={piece.slug} priceUsd={piece.priceUsd} />
              </div>
            ) : (
              <p className="mt-8 text-[13px] leading-relaxed text-mcm-brown-600/75">
                Sold. Inquiries:{" "}
                <a
                  href={ART_SITE.emailHref}
                  className="border-b border-mcm-charcoal-500/15 pb-px transition hover:border-mcm-charcoal-500/35"
                >
                  {ART_SITE.email}
                </a>
                .
              </p>
            )}
          </div>
        </div>
    </main>
  );
}
