import Image from "next/image";

import type { ArtPiece } from "@/lib/art/types";

function hoverPreviewUrl(images: string[]): string | null {
  if (images.length < 2) return null;
  // Two images: use the second as the alternate view.
  // Three or more: last image is often an in-situ / room shot (common upload order).
  if (images.length >= 3) return images[images.length - 1] ?? null;
  return images[1] ?? null;
}

/**
 * Shop / list preview: default shows primary image; on hover (md+ only) crossfades to a
 * second view when the catalog has more than one image. Mobile avoids hover/tap quirks.
 */
export function ArtPieceCardImage({ piece }: { piece: ArtPiece }) {
  const primary = piece.images[0];
  const alternate = hoverPreviewUrl(piece.images);

  if (!primary) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-mcm-cream-100">
        <div className="flex h-full items-center justify-center text-sm text-mcm-brown-600/50">No image</div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-mcm-cream-100">
      <Image
        src={primary}
        alt={piece.title}
        fill
        className={
          alternate
            ? "z-0 object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none md:group-hover:opacity-0"
            : "object-cover transition duration-500 ease-out motion-reduce:transition-none md:group-hover:scale-[1.03]"
        }
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        unoptimized
      />
      {alternate ? (
        <Image
          src={alternate}
          alt=""
          fill
          className="z-[1] hidden object-cover md:block md:opacity-0 md:transition-opacity md:duration-500 md:ease-out motion-reduce:md:transition-none md:group-hover:opacity-100"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
          aria-hidden
        />
      ) : null}
    </div>
  );
}
