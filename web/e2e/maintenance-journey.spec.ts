import { expect, test, type Page } from "@playwright/test";

const requesterEmail = process.env.E2E_REQUESTER_EMAIL;
const requesterPassword = process.env.E2E_REQUESTER_PASSWORD;
const managerEmail = process.env.E2E_MANAGER_EMAIL;
const managerPassword = process.env.E2E_MANAGER_PASSWORD;
const technicianEmail = process.env.E2E_TECHNICIAN_EMAIL;
const technicianPassword = process.env.E2E_TECHNICIAN_PASSWORD;
const technicianName = process.env.E2E_TECHNICIAN_NAME ?? "Demo Technician";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

test("request is reviewed, assigned, inspected, completed, verified, and closed", async ({ browser }) => {
  test.skip(!requesterEmail || !requesterPassword || !managerEmail || !managerPassword || !technicianEmail || !technicianPassword,
    "Set E2E_REQUESTER_EMAIL/PASSWORD, E2E_MANAGER_EMAIL/PASSWORD, and E2E_TECHNICIAN_EMAIL/PASSWORD.");

  const title = `E2E maintenance ${Date.now()}`;
  const requester = await browser.newPage();
  await signIn(requester, requesterEmail!, requesterPassword!);
  await requester.getByRole("button", { name: "Requests" }).click();
  await requester.getByPlaceholder("Request title").fill(title);
  await requester.getByPlaceholder("Describe the issue").fill("Automated journey verification for maintenance lifecycle.");
  await requester.getByRole("button", { name: "Submit request" }).click();
  await expect(requester.getByText("SUBMITTED")).toBeVisible();

  const manager = await browser.newPage();
  await signIn(manager, managerEmail!, managerPassword!);
  await manager.getByRole("button", { name: "Requests" }).click();
  const requestCard = manager.locator("article").filter({ hasText: title });
  await requestCard.getByRole("button", { name: "Approve" }).click();
  await expect(requestCard.getByText("APPROVED")).toBeVisible();
  await requestCard.getByRole("button", { name: "Create work order" }).click();
  await manager.getByRole("button", { name: "Work orders" }).click();
  const orderCard = manager.locator("article").filter({ hasText: title });
  await orderCard.getByRole("combobox", { name: "Assign technician" }).selectOption({ label: technicianName });

  const technician = await browser.newPage();
  await signIn(technician, technicianEmail!, technicianPassword!);
  await technician.getByRole("button", { name: "Work orders" }).click();
  const technicianOrder = technician.locator("article").filter({ hasText: title });
  await technicianOrder.getByRole("button", { name: "Start work" }).click();
  const checklist = technicianOrder.getByRole("group", { name: "Inspection checklist" });
  const boxes = checklist.getByRole("checkbox");
  for (let index = 0; index < await boxes.count(); index++) await boxes.nth(index).check();
  technician.on("dialog", (dialog) => dialog.accept("Inspection and repair completed."));
  await technicianOrder.getByRole("button", { name: "Complete" }).click();
  await expect(technicianOrder.getByText("COMPLETED")).toBeVisible();

  await manager.getByRole("button", { name: "Refresh" }).click();
  const completedOrder = manager.locator("article").filter({ hasText: title });
  await completedOrder.getByRole("button", { name: "Verify" }).click();
  await completedOrder.getByRole("button", { name: "Close" }).click();
  await expect(completedOrder.getByText("CLOSED")).toBeVisible();
  await requester.close();
  await manager.close();
  await technician.close();
});
