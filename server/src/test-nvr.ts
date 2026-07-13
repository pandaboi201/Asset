import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const payload = {
      id: `nvr-${Date.now()}`,
      name: "Test NVR",
      manufacturer: "Hikvision",
      model: "DS-7616NI",
      location: "Server Room",
      ipAddress: "10.20.1.100",
      status: "online",
      channelsTotal: 16,
      storageTotalTb: 8,
      recordingRetentionDays: 30,
      firmwareVersion: "v1.0.0",
      username: "",
      password: "",
      channelsUsed: 0,
      storageUsedTb: 0,
      installedDate: new Date().toISOString(),
      connectedCameraIds: "[]",
    };

    console.log("Attempting to create NVR...");
    const nvr = await prisma.nvr.create({
      data: payload,
    });
    console.log("Success:", nvr);
  } catch (e: any) {
    console.error("Failed!", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
