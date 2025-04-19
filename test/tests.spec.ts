import { test, expect } from "@playwright/test";
import path from "path";

const testsDir = path.join(process.cwd(), "test");

test("increment/decrement", async ({ page }) => {
  await page.goto(`file://${testsDir}/counter.html`);
  await page.getByRole("button", { name: "Increment" }).click();
  await expect(page.locator("strong")).toHaveText("1");
  await page.getByRole("button", { name: "Decrement" }).click();
  await expect(page.locator("strong")).toHaveText("0");
});

test("increment/decrement (iife)", async ({ page }) => {
  await page.goto(`file://${testsDir}/iife.html`);
  await page.getByRole("button", { name: "Increment" }).click();
  await expect(page.locator("strong")).toHaveText("1");
  await page.getByRole("button", { name: "Decrement" }).click();
  await expect(page.locator("strong")).toHaveText("0");
});

test("delayed component being added to DOM", async ({ page }) => {
  await page.goto(`file://${testsDir}/delayed.html`);
  await page.getByRole("button", { name: "Increment" }).click();
  await expect(page.locator("strong")).toHaveText("1");
  await page.getByRole("button", { name: "Decrement" }).click();
  await expect(page.locator("strong")).toHaveText("0");
});

test("multiple controllers", async ({ page }) => {
  await page.goto(`file://${testsDir}/multiple-controllers.html`);
  await page.locator("[data-counter-manager-target=add]").click();
  await expect(page.locator("[data-controller=counter]")).toHaveCount(2);

  await page.locator("[data-counter-target=increment]").first().click();
  await expect(page.locator("strong").first()).toHaveText("1");
  await expect(page.locator("strong").last()).toHaveText("0");

  await page.locator("[data-counter-target=increment]").last().click();
  await page.locator("[data-counter-target=increment]").last().click();
  await expect(page.locator("strong").first()).toHaveText("1");
  await expect(page.locator("strong").last()).toHaveText("2");

  await page.locator("[data-counter-manager-target=remove]").first().click();
  await expect(page.locator("[data-controller=counter]")).toHaveCount(1);
  await expect(page.locator("strong")).toHaveText("2");
});

test("multiple controllers on the same element", async ({ page }) => {
  const promise = page.waitForEvent("console");
  await page.goto(`file://${testsDir}/multiple-controllers-same-element.html`);
  await expect(
    page.locator(
      "[data-controller='clipboard uppercase'][data-controller-id='1']",
    ),
  ).toHaveCount(1);

  await page.locator("[data-uppercase-target=button]").click();
  await page.locator("[data-clipboard-target=button]").click();

  const message = await promise;
  expect(message.text()).toEqual("Copied HELLO THERE!");
});

test("event options", async ({ page }) => {
  await page.goto(`file://${testsDir}/event-options.html`);
  await page.locator("[data-counter-target=increment]").click();
  await page.locator("[data-counter-target=increment]").click();
  await expect(page.locator("strong")).toHaveText("1");
});

test("using @window", async ({ page }) => {
  await page.goto(`file://${testsDir}/window-events.html`);
  await expect(page.locator("strong")).toHaveText("100");
  await page.locator("[data-chars-left-target=input]").fill("hello");
  await expect(page.locator("strong")).toHaveText("95");
});

test("using keyboard events", async ({ page }) => {
  const logs: string[] = [];

  page.on("console", (message) => {
    logs.push(message.text());
  });

  await page.goto(`file://${testsDir}/keyboard-events.html`);
  await page.keyboard.press("Control+c");
  await expect(page.locator("[data-keyboard-events-target=output]")).toHaveText(
    `\n{"ctrl":true,"key":"c"}\n`,
  );
});
