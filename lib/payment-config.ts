/**
 * Payment Configuration
 * Hardcoded payment information - no admin login required
 */

export const PAYMENT_CONFIG = {
  // Venmo - Phone number format
  venmoHandle: "6319015220",
  
  // Bank Account (for display/reference)
  bankAccountName: "Derek DiFazio",
  bankAccountNumber: "", // Leave empty if you don't want to display
  bankRoutingNumber: "", // Leave empty if you don't want to display
  bankName: "", // Leave empty if you don't want to display
  
  // PayPal Email (for PayPal payments)
  paypalEmail: "difaziotennis@gmail.com",
  
  // PayPal.me username (for personal accounts - e.g., "paypal.me/yourname" or just "yourname")
  // Leave empty to use email-based payment link instead
  paypalMeUsername: "difaziotennis", // paypal.me/difaziotennis
  
  // Notification Email
  notificationEmail: "difaziotennis@gmail.com",
} as const;

/**
 * Get Venmo handle with fallback to localStorage (for backward compatibility)
 */
export function getVenmoHandle(): string {
  if (typeof window !== "undefined") {
    // First try hardcoded config
    if (PAYMENT_CONFIG.venmoHandle) {
      return PAYMENT_CONFIG.venmoHandle;
    }
    
    // Fallback to localStorage (for backward compatibility)
    try {
      const saved = localStorage.getItem("paymentSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        return settings.venmoHandle || "";
      }
    } catch (e) {
      console.error("Error loading Venmo handle from localStorage:", e);
    }
  }
  
  return PAYMENT_CONFIG.venmoHandle || "";
}

/**
 * Get bank account info
 */
export function getBankInfo() {
  return {
    accountName: PAYMENT_CONFIG.bankAccountName,
    accountNumber: PAYMENT_CONFIG.bankAccountNumber,
    routingNumber: PAYMENT_CONFIG.bankRoutingNumber,
    bankName: PAYMENT_CONFIG.bankName,
  };
}

