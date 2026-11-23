import bcrypt from "bcryptjs";
import { db } from "../src/lib/prisma";

async function main() {
  if (process.env.NODE_ENV !== "development" || process.env.ENABLE_DEMO_SEED !== "true") {
    throw new Error("Demo seeding is disabled. Set NODE_ENV=development and ENABLE_DEMO_SEED=true explicitly.");
  }
  const demoPassword = process.env.DEMO_SEED_PASSWORD;
  if (!demoPassword || demoPassword.length < 14) throw new Error("Set DEMO_SEED_PASSWORD (at least 14 characters) explicitly for development seeding.");
  if (await db.user.count() > 0) throw new Error("Refusing to seed a non-empty user database.");
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  await db.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { id: "00000000-0000-4000-8000-000000000001", name: "Demo Maintenance Organization" } });
    const location = await tx.location.create({ data: { id: "00000000-0000-4000-8000-000000000002", name: "Demo Site", organizationId: organization.id } });
    const users = await Promise.all([
      tx.user.create({ data: { id: "00000000-0000-4000-8000-000000000011", organizationId: organization.id, locationId: location.id, name: "Demo Administrator", email: "admin.demo@example.invalid", passwordHash, role: "ADMIN" } }),
      tx.user.create({ data: { id: "00000000-0000-4000-8000-000000000012", organizationId: organization.id, locationId: location.id, name: "Demo Manager", email: "manager.demo@example.invalid", passwordHash, role: "MANAGER" } }),
      tx.user.create({ data: { id: "00000000-0000-4000-8000-000000000013", organizationId: organization.id, locationId: location.id, name: "Demo Technician", email: "technician.demo@example.invalid", passwordHash, role: "TECHNICIAN" } }),
      tx.user.create({ data: { id: "00000000-0000-4000-8000-000000000014", organizationId: organization.id, locationId: location.id, name: "Demo Requester", email: "requester.demo@example.invalid", passwordHash, role: "REQUESTER" } }),
    ]);
    const asset = await tx.asset.create({
      data: { id: "00000000-0000-4000-8000-000000000021", organizationId: organization.id, locationId: location.id, code: "DEMO-HVAC-01", name: "North Wing HVAC", category: "HVAC", criticality: "HIGH" },
    });
    const part = await tx.part.create({
      data: { id: "00000000-0000-4000-8000-000000000022", organizationId: organization.id, locationId: location.id, sku: "DEMO-FILTER-01", name: "Air filter", quantityOnHand: 12, reorderPoint: 4 },
    });
    await tx.inventoryMovement.create({
      data: { id: "00000000-0000-4000-8000-000000000023", partId: part.id, actorId: users[0].id, type: "RECEIPT", quantity: 12, reason: "Demo opening balance" },
    });
    await tx.maintenanceRequest.create({
      data: {
        id: "00000000-0000-4000-8000-000000000031",
        organizationId: organization.id, locationId: location.id, requesterId: users[3].id,
        assetId: asset.id, title: "Inspect unusual vibration", description: "Vibration has increased during normal operation.",
        priority: "MEDIUM",
      },
    });
  });
  console.log("Development-only demo data created.");
  console.log("All demo users use DEMO_SEED_PASSWORD; do not use this dataset or password outside disposable development.");
  console.log("Accounts: admin.demo@example.invalid, manager.demo@example.invalid, technician.demo@example.invalid, requester.demo@example.invalid");
}

main().catch((error: unknown) => {
  console.error("Demo seed failed.", error);
  process.exitCode = 1;
}).finally(async () => db.$disconnect());
