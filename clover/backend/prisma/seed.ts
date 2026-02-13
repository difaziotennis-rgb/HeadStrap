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
      narUserSplit: 0.5,
      narPlatformSplit: 0.5,
      silentUserSplit: 0.3,
      silentPlatformSplit: 0.7,
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
