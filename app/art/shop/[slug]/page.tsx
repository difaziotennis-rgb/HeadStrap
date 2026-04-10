import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArtCheckoutButton } from "@/components/art/ArtCheckoutButton";
import { artPieces, formatUsd, getArtPieceBySlug } from "@/lib/art/catalog";
import { inquireAboutPieceMailto, inquireStudioMailto } from "@/lib/art/inquire";

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
              <div className="mt-10 space-y-6">
                <div className="border border-mcm-cream-200/70 bg-white/70 p-6">
                  <p className="text-[10px] font-normal uppercase tracking-[0.28em] text-mcm-brown-600/50">Purchase</p>
                  <div className="mt-4">
                    <ArtCheckoutButton slug={piece.slug} priceUsd={piece.priceUsd} />
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-mcm-brown-600/65">
                    Secure checkout. Taxes and shipping may be confirmed by email after purchase.
                  </p>
                </div>
                <div className="border border-mcm-cream-200/50 bg-[#faf8f4]/60 p-6">
                  <p className="text-[10px] font-normal uppercase tracking-[0.28em] text-mcm-brown-600/50">Inquire</p>
                  <p className="mt-3 text-[13px] leading-relaxed text-mcm-brown-600/75">
                    Questions about framing, pickup, or shipping? Want to discuss a commission?
                  </p>
                  <a
                    href={inquireAboutPieceMailto(piece.title, piece.slug)}
                    className="mt-4 inline-block text-[13px] border-b border-mcm-charcoal-500/25 pb-px text-mcm-charcoal-600/90 transition hover:border-mcm-charcoal-500/45"
                  >
                    Email about this work
                  </a>
                  <span className="mx-2 text-mcm-cream-300">·</span>
                  <a
                    href={inquireStudioMailto()}
                    className="inline-block text-[13px] border-b border-mcm-charcoal-500/25 pb-px text-mcm-charcoal-600/90 transition hover:border-mcm-charcoal-500/45"
                  >
                    General studio inquiry
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-10 border border-mcm-cream-200/50 bg-[#faf8f4]/60 p-6">
                <p className="text-[10px] font-normal uppercase tracking-[0.28em] text-mcm-brown-600/50">Sold</p>
                <p className="mt-3 text-[13px] leading-relaxed text-mcm-brown-600/75">
                  This piece is sold. Ask about similar work or a studio visit.
                </p>
                <a
                  href={inquireAboutPieceMailto(piece.title, piece.slug)}
                  className="mt-4 inline-block text-[13px] border-b border-mcm-charcoal-500/25 pb-px text-mcm-charcoal-600/90 transition hover:border-mcm-charcoal-500/45"
                >
                  Inquire
                </a>
              </div>
            )}
          </div>
        </div>
    </main>
  );
}
