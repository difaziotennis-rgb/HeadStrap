import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Ensure platform config exists
  await prisma.platformConfig.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      narRatePerMinute: 0.28,
      silentRatePerMinute: 0.12,
      narUserSplit: 0.6,
      narPlatformSplit: 0.4,
      silentUserSplit: 0.4,
      silentPlatformSplit: 0.6,
    },
  });

  console.log("  Platform config created.");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
