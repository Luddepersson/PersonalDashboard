import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the dashboard and show greeting", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
    const greeting = await page.locator("h1").textContent();
    expect(greeting).toMatch(/God (morgon|eftermiddag|kväll|natt)|Välkommen/);
  });

  test("should display clock widget with time", async ({ page }) => {
    const clock = page.locator("#section-clock");
    await expect(clock).toBeVisible();
    // Should show digits in HH:MM format
    await expect(clock.locator("text=/\\d{2}/").first()).toBeVisible();
  });

  test("should display weather widget", async ({ page }) => {
    const weather = page.locator("#section-weather");
    await expect(weather).toBeVisible();
    await expect(weather.locator("text=Väder")).toBeVisible();
  });

  test("should display calendar and navigate months", async ({ page }) => {
    const calendar = page.locator("#section-calendar");
    await expect(calendar).toBeVisible();

    // Should show weekday headers
    await expect(calendar.locator("text=Mån")).toBeVisible();
    await expect(calendar.locator("text=Fre")).toBeVisible();

    // Navigate to next month
    const nextBtn = calendar.locator("button").filter({ has: page.locator("svg") }).last();
    await nextBtn.click();
    // Calendar should still be visible after navigation
    await expect(calendar.locator("text=Mån")).toBeVisible();
  });

  test("should add and toggle a todo item", async ({ page }) => {
    const todos = page.locator("#section-todos");
    await expect(todos).toBeVisible();

    // Add a new todo
    const input = todos.locator('input[placeholder*="uppgift"]');
    await input.fill("Test todo item");
    await input.press("Enter");

    // Should appear in the list
    await expect(todos.locator("text=Test todo item")).toBeVisible();

    // Toggle it
    const checkbox = todos.locator("text=Test todo item").locator("..").locator("button").first();
    await checkbox.click();
  });

  test("should open command palette with Cmd+K", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    const palette = page.locator('input[placeholder*="Sök kommandon"]');
    await expect(palette).toBeVisible();

    // Type to filter
    await palette.fill("Kalender");
    await expect(page.locator("text=Visa kalender")).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(palette).not.toBeVisible();
  });

  test("should toggle theme between dark and light", async ({ page }) => {
    // Initially dark
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "dark");

    // Click theme toggle
    const themeBtn = page.locator('button[aria-label*="tema"]');
    await themeBtn.click();

    await expect(html).toHaveAttribute("data-theme", "light");

    // Toggle back
    await themeBtn.click();
    await expect(html).toHaveAttribute("data-theme", "dark");
  });

  test("should display pomodoro timer and start it", async ({ page }) => {
    const pomodoro = page.locator("#section-pomodoro");
    await expect(pomodoro).toBeVisible();
    await expect(pomodoro.locator("text=Fokus")).toBeVisible();

    // Start the timer
    const startBtn = pomodoro.locator("text=Starta");
    await startBtn.click();

    // Should show Paus button
    await expect(pomodoro.locator("text=Paus")).toBeVisible();

    // Stop it
    await pomodoro.locator("text=Paus").click();
  });

  test("should add a calendar reminder", async ({ page }) => {
    const calendar = page.locator("#section-calendar");
    await expect(calendar).toBeVisible();

    // Click the add button
    const addBtn = calendar.locator("button").filter({ has: page.locator("svg") }).last();
    await addBtn.click();

    // Fill in reminder
    const input = calendar.locator('input[placeholder*="Påminnelse"]');
    if (await input.isVisible()) {
      await input.fill("Möte med teamet");
      await calendar.locator("text=Spara").click();
      await expect(calendar.locator("text=Möte med teamet")).toBeVisible();
    }
  });

  test("should display stats bar with animated numbers", async ({ page }) => {
    await expect(page.locator("text=Projekt")).toBeVisible();
    await expect(page.locator("text=Commits")).toBeVisible();
    await expect(page.locator("text=Teknologier")).toBeVisible();
    await expect(page.locator("text=Kodtimmar")).toBeVisible();
  });

  test("should have working quick links", async ({ page }) => {
    const links = page.locator("#section-links");
    await expect(links).toBeVisible();
    await expect(links.locator("text=GitHub")).toBeVisible();
    await expect(links.locator("text=VS Code")).toBeVisible();
  });
});

test.describe("Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("should show hamburger menu on mobile", async ({ page }) => {
    await page.goto("/");
    // Sidebar should be hidden, hamburger visible
    const hamburger = page.locator("button").filter({ has: page.locator("svg") }).first();
    await expect(hamburger).toBeVisible();
  });
});
