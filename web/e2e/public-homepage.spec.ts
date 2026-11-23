import { expect, test } from "@playwright/test";

test("public homepage explains maintenance capabilities and offers contact and sign-in paths", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", {
    name: "Keep your sites moving with maintenance that connects the whole team.",
  })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toHaveAttribute("href", "/login");
  await expect(page.getByRole("heading", { name: "The practical tools behind reliable maintenance." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tell us what your operation needs." })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Work email" })).toBeVisible();
  await expect(page.getByText("not a customer case study or performance claim")).toBeVisible();
  await expect((await page.request.get("/api/contact")).status()).toBe(401);
});
