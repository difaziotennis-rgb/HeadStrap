-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "calibrated" BOOLEAN NOT NULL DEFAULT false,
    "stripeConnectId" TEXT,
    "payoutMethod" TEXT NOT NULL DEFAULT 'none',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "durationMinutes" REAL NOT NULL DEFAULT 0,
    "dataSizeMB" REAL NOT NULL DEFAULT 0,
    "narrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "estimatedEarnings" REAL NOT NULL DEFAULT 0,
    "actualEarnings" REAL NOT NULL DEFAULT 0,
    "userPayout" REAL NOT NULL DEFAULT 0,
    "platformRevenue" REAL NOT NULL DEFAULT 0,
    "dataSaleStatus" TEXT NOT NULL DEFAULT 'pending_upload',
    "uploadedToCloud" BOOLEAN NOT NULL DEFAULT false,
    "cloudStorageKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recording',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dataPackageId" TEXT,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Session_dataPackageId_fkey" FOREIGN KEY ("dataPackageId") REFERENCES "DataPackage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT NOT NULL DEFAULT 'stripe',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "stripeTransferId" TEXT,
    CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "totalSizeMB" REAL NOT NULL DEFAULT 0,
    "totalDurationMinutes" REAL NOT NULL DEFAULT 0,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "salePrice" REAL,
    "soldAt" DATETIME,
    "buyerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "narRatePerMinute" REAL NOT NULL DEFAULT 0.28,
    "silentRatePerMinute" REAL NOT NULL DEFAULT 0.12,
    "narUserSplit" REAL NOT NULL DEFAULT 0.6,
    "narPlatformSplit" REAL NOT NULL DEFAULT 0.4,
    "silentUserSplit" REAL NOT NULL DEFAULT 0.4,
    "silentPlatformSplit" REAL NOT NULL DEFAULT 0.6,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_dataSaleStatus_idx" ON "Session"("dataSaleStatus");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Payout_userId_idx" ON "Payout"("userId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");
