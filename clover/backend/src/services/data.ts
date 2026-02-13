import prisma from "../lib/prisma";
import { getSessionRates } from "./earnings";

const MB_PER_MINUTE = 45;

/**
 * Data Collection Service — Azure Blob Storage integration stub.
 *
 * All functions are ready to wire up to real Azure calls.
 * Replace the TODO sections with Azure SDK calls when ready.
 */
export const dataService = {
  /**
   * Queue a completed session for upload to Azure Blob Storage.
   *
   * In production:
   *   const { BlobServiceClient } = require('@azure/storage-blob');
   *   const blobService = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION);
   *   const container = blobService.getContainerClient(process.env.AZURE_CONTAINER_NAME);
   *   const blob = container.getBlockBlobClient(key);
   *   await blob.upload(data, data.length);
   */
  async queueUpload(sessionId: string): Promise<{ cloudStorageKey: string }> {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error("Session not found");

    const date = new Date().toISOString().split("T")[0];
    const key = `recordings/${date}/${session.id}/${session.type.toLowerCase().replace(/\s+/g, "-")}.mp4`;

    // TODO: Replace with real Azure upload
    // const { BlobServiceClient } = require('@azure/storage-blob');
    // ...

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        cloudStorageKey: key,
        dataSaleStatus: "uploaded",
        uploadedToCloud: true,
      },
    });

    return { cloudStorageKey: key };
  },

  /**
   * Get all data for admin export / packaging.
   */
  async getAllData(filters?: { userId?: string; status?: string; narrated?: boolean }) {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.dataSaleStatus = filters.status;
    if (filters?.narrated !== undefined) where.narrationEnabled = filters.narrated;

    const sessions = await prisma.session.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { startTime: "desc" },
    });

    const totalDataMB = sessions.reduce((s, x) => s + x.dataSizeMB, 0);
    const totalMinutes = sessions.reduce((s, x) => s + x.durationMinutes, 0);

    return {
      sessions,
      totalSessions: sessions.length,
      totalDataMB: +totalDataMB.toFixed(1),
      totalDataGB: +(totalDataMB / 1024).toFixed(2),
      totalHours: +(totalMinutes / 60).toFixed(1),
      uploadedCount: sessions.filter((s) => s.uploadedToCloud).length,
      pendingUploadCount: sessions.filter((s) => !s.uploadedToCloud).length,
      cloudStorageKeys: sessions.filter((s) => s.cloudStorageKey).map((s) => s.cloudStorageKey!),
    };
  },

  /**
   * Export a JSON manifest of all data — for packaging and selling.
   */
  async exportManifest(sessionIds?: string[]) {
    const where: any = { status: "completed" };
    if (sessionIds && sessionIds.length > 0) {
      where.id = { in: sessionIds };
    }

    const sessions = await prisma.session.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { startTime: "desc" },
    });

    return {
      exportedAt: new Date().toISOString(),
      totalSessions: sessions.length,
      totalDataMB: +sessions.reduce((s, x) => s + x.dataSizeMB, 0).toFixed(1),
      totalHours: +(sessions.reduce((s, x) => s + x.durationMinutes, 0) / 60).toFixed(1),
      sessions: sessions.map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: s.user.name,
        type: s.type,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime?.toISOString(),
        durationMinutes: s.durationMinutes,
        dataSizeMB: s.dataSizeMB,
        narrationEnabled: s.narrationEnabled,
        cloudStorageKey: s.cloudStorageKey,
        dataSaleStatus: s.dataSaleStatus,
      })),
    };
  },

  /**
   * Mark sessions as sold — calculates actual earnings and revenue splits.
   */
  async markSold(sessionIds: string[], totalSalePrice: number, buyerId?: string) {
    const sessions = await prisma.session.findMany({
      where: { id: { in: sessionIds } },
    });

    if (sessions.length === 0) throw new Error("No sessions found");

    const totalMinutes = sessions.reduce((s, x) => s + x.durationMinutes, 0);

    const updates = [];
    for (const session of sessions) {
      const proportion = session.durationMinutes / totalMinutes;
      const sessionPrice = +(totalSalePrice * proportion).toFixed(2);
      const rates = await getSessionRates(session.narrationEnabled);
      const userPayout = +(sessionPrice * rates.userSplit).toFixed(2);
      const platformRevenue = +(sessionPrice * rates.platformSplit).toFixed(2);

      updates.push(
        prisma.session.update({
          where: { id: session.id },
          data: {
            actualEarnings: sessionPrice,
            userPayout,
            platformRevenue,
            dataSaleStatus: "sold",
          },
        })
      );
    }

    await prisma.$transaction(updates);

    return {
      sessionCount: sessions.length,
      totalSalePrice,
      totalMinutes,
    };
  },
};
