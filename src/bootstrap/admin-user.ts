import { prisma } from "../../lib/prisma";
import { hashPassword } from "../utils/password";

export async function ensureBootstrapAdminUser(): Promise<void> {
  const username = String(process.env.ADMIN_BOOTSTRAP_USERNAME ?? "admin").trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();

  if (!password) {
    return;
  }

  try {
    const countRows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS "count" FROM "AdminUser"
    `;
    const existingAdmins = Number(countRows[0]?.count ?? 0n);
    if (existingAdmins > 0) {
      return;
    }

    const passwordHash = await hashPassword(password);
    await prisma.$executeRaw`
      INSERT INTO "AdminUser" ("username", "passwordHash", "isActive", "createdAt", "updatedAt")
      VALUES (${username}, ${passwordHash}, true, NOW(), NOW())
    `;

    console.log(`Bootstrap admin user created: ${username}`);
  } catch (error) {
    console.warn("Skipped bootstrap admin creation:", error);
  }
}
