import { NextResponse } from "next/server";

/**
 * Verify Stripe configuration
 * This endpoint checks if Stripe keys are properly configured
 */
export async function GET() {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const secretKey = process.env.STRIPE_SECRET_KEY;

    // Check if keys exist
    const hasPublishableKey = !!publishableKey;
    const hasSecretKey = !!secretKey;

    // Check key formats
    const publishableKeyValid = hasPublishableKey && (
      publishableKey.startsWith("pk_test_") || 
      publishableKey.startsWith("pk_live_")
    );
    
    const secretKeyValid = hasSecretKey && (
      secretKey.startsWith("sk_test_") || 
      secretKey.startsWith("sk_live_")
    );

    // Determine environment
    const environment = publishableKey?.startsWith("pk_live_") ? "production" : "test";

    return NextResponse.json({
      success: hasPublishableKey && hasSecretKey && publishableKeyValid && secretKeyValid,
      configured: {
        publishableKey: hasPublishableKey,
        secretKey: hasSecretKey,
      },
      valid: {
        publishableKey: publishableKeyValid,
        secretKey: secretKeyValid,
      },
      environment,
      publishableKeyPrefix: publishableKey ? publishableKey.substring(0, 12) + "..." : "not set",
      secretKeyPrefix: secretKey ? secretKey.substring(0, 12) + "..." : "not set",
      message: hasPublishableKey && hasSecretKey && publishableKeyValid && secretKeyValid
        ? "✅ Stripe is properly configured!"
        : "❌ Stripe configuration is incomplete or invalid",
      issues: [
        !hasPublishableKey && "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing",
        !hasSecretKey && "STRIPE_SECRET_KEY is missing",
        hasPublishableKey && !publishableKeyValid && "Publishable key format is invalid (should start with pk_test_ or pk_live_)",
        hasSecretKey && !secretKeyValid && "Secret key format is invalid (should start with sk_test_ or sk_live_)",
      ].filter(Boolean),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}







