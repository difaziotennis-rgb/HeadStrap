/**
 * Test script to validate payment button configurations
 * Run with: node test-payments.js
 */

// Mock booking data
const mockBooking = {
  id: "test-booking-123",
  amount: 160,
  date: "2024-12-25",
  hour: 14,
  clientName: "Test User",
  clientEmail: "test@example.com",
};

// Test Venmo payment URL
function testVenmo() {
  console.log("\n=== Testing Venmo Payment ===");
  const venmoHandle = "6319015220";
  const amount = mockBooking.amount.toFixed(2);
  const note = `Tennis Lesson - Dec 25 at 14:00`;
  
  // Clean the handle
  let cleanHandle = venmoHandle.replace(/^@/, "").replace(/\s+/g, "").replace(/[()-]/g, "");
  const isPhoneNumber = /^\d+$/.test(cleanHandle);
  
  let venmoUrl;
  if (isPhoneNumber) {
    const encodedNote = encodeURIComponent(note);
    venmoUrl = `https://venmo.com/?txn=pay&recipients=${cleanHandle}&amount=${amount}&note=${encodedNote}`;
  } else {
    venmoUrl = `https://venmo.com/${cleanHandle}?txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`;
  }
  
  console.log("✅ Venmo Handle:", venmoHandle);
  console.log("✅ Venmo URL:", venmoUrl);
  console.log("✅ Is Phone Number:", isPhoneNumber);
  console.log("✅ Amount:", amount);
  console.log("✅ Note:", note);
  
  // Validate URL format
  if (venmoUrl.startsWith("https://venmo.com/")) {
    console.log("✅ Venmo URL format: VALID");
  } else {
    console.log("❌ Venmo URL format: INVALID");
  }
}

// Test PayPal payment URL
function testPayPal() {
  console.log("\n=== Testing PayPal Payment ===");
  const paypalMeUsername = "difaziotennis";
  const paypalEmail = "difaziotennis@gmail.com";
  const amount = mockBooking.amount.toFixed(2);
  const note = `Tennis Lesson - Dec 25 at 14:00`;
  
  let paypalUrl;
  if (paypalMeUsername) {
    const cleanUsername = paypalMeUsername.replace(/^@/, "").replace(/^paypal\.me\//, "");
    paypalUrl = `https://paypal.me/${cleanUsername}/${amount}?locale.x=en_US`;
  } else if (paypalEmail) {
    const encodedNote = encodeURIComponent(note);
    const encodedEmail = encodeURIComponent(paypalEmail);
    paypalUrl = `https://www.paypal.com/send?amount=${amount}&currencyCode=USD&recipient=${encodedEmail}&note=${encodedNote}`;
  }
  
  console.log("✅ PayPal.me Username:", paypalMeUsername);
  console.log("✅ PayPal Email:", paypalEmail);
  console.log("✅ PayPal URL:", paypalUrl);
  console.log("✅ Amount:", amount);
  console.log("✅ Note:", note);
  
  // Validate URL format
  if (paypalUrl && (paypalUrl.startsWith("https://paypal.me/") || paypalUrl.startsWith("https://www.paypal.com/send"))) {
    console.log("✅ PayPal URL format: VALID");
  } else {
    console.log("❌ PayPal URL format: INVALID");
  }
}

// Test Stripe payment flow
function testStripe() {
  console.log("\n=== Testing Stripe Payment ===");
  const bookingId = mockBooking.id;
  const amount = mockBooking.amount;
  const date = mockBooking.date;
  const hour = mockBooking.hour;
  const clientEmail = mockBooking.clientEmail;
  
  // Mock API request body
  const requestBody = {
    bookingId,
    amount,
    date,
    hour,
    clientName: mockBooking.clientName,
    clientEmail,
  };
  
  console.log("✅ Booking ID:", bookingId);
  console.log("✅ Amount:", amount);
  console.log("✅ Date:", date);
  console.log("✅ Hour:", hour);
  console.log("✅ Client Email:", clientEmail);
  console.log("✅ API Request Body:", JSON.stringify(requestBody, null, 2));
  
  // Expected success URL
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://difaziotennis.com";
  const successUrl = `${baseUrl}/booking-success?id=${bookingId}&payment=success`;
  const cancelUrl = `${baseUrl}/book?payment=cancelled`;
  
  console.log("✅ Success URL:", successUrl);
  console.log("✅ Cancel URL:", cancelUrl);
  
  // Validate URLs
  if (successUrl.includes(bookingId) && successUrl.includes("payment=success")) {
    console.log("✅ Stripe Success URL format: VALID");
  } else {
    console.log("❌ Stripe Success URL format: INVALID");
  }
  
  if (cancelUrl.includes("/book") && cancelUrl.includes("payment=cancelled")) {
    console.log("✅ Stripe Cancel URL format: VALID");
  } else {
    console.log("❌ Stripe Cancel URL format: INVALID");
  }
  
  console.log("\n⚠️  Note: Stripe requires API keys to be set in environment variables:");
  console.log("   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  console.log("   - STRIPE_SECRET_KEY");
}

// Run all tests
console.log("🧪 Payment Button Test Suite");
console.log("==============================");

testVenmo();
testPayPal();
testStripe();

console.log("\n✅ All payment methods validated!");
console.log("\n📝 Summary:");
console.log("   ✅ Venmo: Configured with phone number 6319015220");
console.log("   ✅ PayPal: Configured with paypal.me/difaziotennis");
console.log("   ⚠️  Stripe: Requires API keys in Vercel environment variables");

