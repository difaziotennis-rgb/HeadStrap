import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getArtPieceBySlug, getPieceDescription } from "@/lib/art/catalog";

type Body = {
  slug?: string;
  customerEmail?: string;
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const slug = String(body.slug || "").trim();
    if (!slug) {
      return NextResponse.json({ error: "Missing artwork." }, { status: 400 });
    }

    const customerEmail = String(body.customerEmail || "").trim();
    if (!isValidEmail(customerEmail)) {
      return NextResponse.json({ error: "A valid email is required for checkout." }, { status: 400 });
    }

    const piece = getArtPieceBySlug(slug);
    if (!piece) {
      return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
    }
    if (piece.availability !== "available") {
      return NextResponse.json({ error: "This piece is not available for purchase." }, { status: 400 });
    }

    const amountUsd = piece.priceUsd;
    if (!amountUsd || amountUsd <= 0) {
      return NextResponse.json({ error: "Invalid price." }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Payments are not configured." }, { status: 500 });
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-02-25.clover" });

    const primaryImage = piece.images[0];
    const stripeProductImages =
      primaryImage && /\.(jpe?g|png|webp)$/i.test(primaryImage) ? [primaryImage] : undefined;

    const longDesc = getPieceDescription(piece.slug);
    const productDescription = longDesc
      ? `${longDesc.slice(0, 450)}${longDesc.length > 450 ? "…" : ""} · ${piece.category}`
      : `E. DiFazio Art — ${piece.category}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: piece.title,
              description: productDescription,
              images: stripeProductImages,
            },
            unit_amount: Math.round(amountUsd * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/shop/${encodeURIComponent(slug)}?cancelled=1`,
      customer_email: customerEmail,
      metadata: {
        art_slug: piece.slug,
        art_title: piece.title,
        source: "e-difazio-art",
        buyer_email: customerEmail,
      },
      payment_intent_data: {
        metadata: {
          art_slug: piece.slug,
          art_title: piece.title,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout could not be started." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
