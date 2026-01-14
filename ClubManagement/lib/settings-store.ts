// Shared settings store for the application
// In production, this should be moved to a database

export type SettingsStore = {
  club: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    email: string
  }
  billing: {
    stripeSecretKey: string
    stripePublishableKey: string
    billingDay: string
    gracePeriod: string
  }
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    statementReminders: boolean
    bookingConfirmations: boolean
  }
  payments: {
    stripe: {
      enabled: boolean
      publishableKey: string
      secretKey: string
      webhookSecret: string
      testMode: boolean
    }
    paypal: {
      enabled: boolean
      clientId: string
      clientSecret: string
      mode: string
    }
    ach: {
      enabled: boolean
      processor: string
    }
  }
}

let settingsStore: SettingsStore = {
  club: {
    name: "Elite Country Club",
    address: "123 Country Club Drive",
    city: "Beverly Hills",
    state: "CA",
    zip: "90210",
    phone: "(555) 123-4567",
    email: "info@eliteclub.com",
  },
  billing: {
    stripeSecretKey: "",
    stripePublishableKey: "",
    billingDay: "1",
    gracePeriod: "15",
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    statementReminders: true,
    bookingConfirmations: true,
  },
  payments: {
    stripe: {
      enabled: true,
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
      testMode: true,
    },
    paypal: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      mode: "sandbox",
    },
    ach: {
      enabled: true,
      processor: "stripe",
    },
  },
}

export function getSettings(section?: keyof SettingsStore | "all"): SettingsStore | Partial<SettingsStore> {
  if (!section || section === "all") {
    return settingsStore
  }
  return settingsStore[section] || {}
}

export function updateSettings(section: keyof SettingsStore, updates: Partial<SettingsStore[keyof SettingsStore]>): void {
  if (settingsStore[section]) {
    settingsStore[section] = { ...settingsStore[section], ...updates } as any
  }
}

export { settingsStore }


