import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../src/lib/prisma";

async function main() {
  const email = z.string().email().max(254).parse(process.env.BOOTSTRAP_ADMIN_EMAIL).toLowerCase();
  const password = z.string().min(14).max(200).parse(process.env.BOOTSTRAP_ADMIN_PASSWORD);
  const organizationName = process.env.BOOTSTRAP_ORGANIZATION?.trim() || "Maintenance Organization";
  const locationName = process.env.BOOTSTRAP_LOCATION?.trim() || "Main Site";
  const passwordHash = await bcrypt.hash(password, 12);
  const created = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(1380203348)`;
    if (await tx.user.count() !== 0) throw new Error("Bootstrap is one-time only and is allowed only before the first user exists.");
    const organization = await tx.organization.create({ data: { name: organizationName } });
    const location = await tx.location.create({ data: { organizationId: organization.id, name: locationName } });
    return tx.user.create({
      data: {
        organizationId: organization.id, locationId: location.id, email,
        name: process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "System Administrator",
        role: "ADMIN", passwordHash,
      },
    });
  });
  console.log(`Created initial administrator ${created.email} for ${organizationName} / ${locationName}.`);
  console.log("Remove the bootstrap credentials from the environment and rotate the password through your credential-management process.");
}

main().catch((error: unknown) => {
  console.error("Administrator bootstrap failed.", error);
  process.exitCode = 1;
}).finally(async () => db.$disconnect());
