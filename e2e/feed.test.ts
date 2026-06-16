// Runs against the configured Android device (see mobilewright.config.ts).
// Assumes the test account is already signed in and at least one post exists.
import { expect, test } from "@mobilewright/test";

test.describe("Feed timeline notes", () => {
  test("home feed shows a beta video card", async ({ screen }) => {
    await expect(screen.getByText("BoulderBase")).toBeVisible();
    await expect(screen.getByText("Add Note")).toBeVisible();
  });

  test("can add a beta note pinned to the current timestamp", async ({
    screen,
  }) => {
    await screen.getByText("Add Note").tap();

    // Composer opens, pinned at the current playback position.
    await expect(screen.getByText(/Pinned at/)).toBeVisible();

    await screen
      .getByPlaceholder("Share your beta for this moment...")
      .fill("Heel hook on the arete");
    await screen.getByText("Post Note").tap();

    // Composer closes after a successful post.
    await expect(screen.getByText("Post Note")).not.toBeVisible();
  });
});
