import { expect, test } from "@mobilewright/test";

test.describe("Auth flow", () => {
  test("shows login screen on launch", async ({ screen }) => {
    await expect(screen.getByText("Sign In")).toBeVisible();
  });

  test("logs in with valid credentials", async ({ screen }) => {
    await screen.getByLabel("Email").fill("luukwillem@gmail.com");
    await screen.getByLabel("Password").fill("testpassword");
    await screen.getByRole("button", { name: "Sign In" }).tap();
    await expect(screen.getByText("Home")).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ screen }) => {
    await screen.getByLabel("Email").fill("wrong@example.com");
    await screen.getByLabel("Password").fill("wrongpass");
    await screen.getByRole("button", { name: "Sign In" }).tap();
    await expect(screen.getByText("Invalid credentials")).toBeVisible();
  });
});
