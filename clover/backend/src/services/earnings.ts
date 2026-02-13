import prisma from "../lib/prisma";

/** Get the platform rate config */
export async function getRates() {
  let config = await prisma.platformConfig.findUnique({ where: { id: "global" } });
  if (!config) {
    config = await prisma.platformConfig.create({
      data: { id: "global" },
    });
  }
  return config;
}

/** Get rate and split for a session based on narration */
export async function getSessionRates(narrated: boolean) {
  const config = await getRates();
  return {
    estRate: narrated ? config.narRatePerMinute : config.silentRatePerMinute,
    userSplit: narrated ? config.narUserSplit : config.silentUserSplit,
    platformSplit: narrated ? config.narPlatformSplit : config.silentPlatformSplit,
  };
}

/** Calculate estimated earnings for a session */
export async function calculateEstimatedEarnings(durationMinutes: number, narrated: boolean) {
  const rates = await getSessionRates(narrated);
  return +(durationMinutes * rates.estRate).toFixed(2);
}

/** Calculate actual earnings split when data is sold */
export async function calculateSplit(salePrice: number, narrated: boolean) {
  const rates = await getSessionRates(narrated);
  return {
    userPayout: +(salePrice * rates.userSplit).toFixed(2),
    platformRevenue: +(salePrice * rates.platformSplit).toFixed(2),
  };
}

/** Get full earnings summary for a user */
export async function getUserEarnings(userId: string) {
  const sessions = await prisma.session.findMany({
    where: { userId, status: "completed" },
    orderBy: { startTime: "desc" },
  });

  const payouts = await prisma.payout.findMany({
    where: { userId },
  });

  const totalEstimated = sessions.reduce((s, x) => s + x.estimatedEarnings, 0);
  const totalActualEarned = sessions.reduce((s, x) => s + x.actualEarnings, 0);
  const totalUserPayouts = sessions.reduce((s, x) => s + x.userPayout, 0);
  const totalPlatformRevenue = sessions.reduce((s, x) => s + x.platformRevenue, 0);
  const paidOut = payouts
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);
  const pendingPayout = Math.max(0, +(totalUserPayouts - paidOut).toFixed(2));
  const totalDataMB = sessions.reduce((s, x) => s + x.dataSizeMB, 0);
  const totalMinutes = sessions.reduce((s, x) => s + x.durationMinutes, 0);

  return {
    totalEstimated: +totalEstimated.toFixed(2),
    totalActualEarned: +totalActualEarned.toFixed(2),
    totalUserPayouts: +totalUserPayouts.toFixed(2),
    totalPlatformRevenue: +totalPlatformRevenue.toFixed(2),
    pendingPayout,
    paidOut: +paidOut.toFixed(2),
    totalDataGB: +(totalDataMB / 1024).toFixed(2),
    totalHours: +(totalMinutes / 60).toFixed(1),
    sessions,
  };
}
