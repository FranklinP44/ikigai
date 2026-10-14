import { expect, test, type Page } from "@playwright/test";

// Hover is computed from the pointer position in SVG coordinates, so tests move the real mouse
// to a point inside a zone instead of hovering a zone element.
async function moveToSvgPoint(page: Page, x: number, y: number): Promise<void> {
  const svg = page.locator("#ikigai");
  await svg.scrollIntoViewIfNeeded();
  const point = await svg.evaluate(
    (node, [px, py]) => {
      const ctm = (node as SVGSVGElement).getScreenCTM();
      if (!ctm) throw new Error("The diagram has no screen transform");
      const p = new DOMPoint(px, py).matrixTransform(ctm);
      return { x: p.x, y: p.y };
    },
    [x, y] as const,
  );
  await page.mouse.move(point.x, point.y);
}

const PILLS = [
  { zone: "LGNP", title: "Ikigai" },
  { zone: "LG", title: "Passion" },
  { zone: "LN", title: "Mission" },
  { zone: "GP", title: "Profession" },
  { zone: "NP", title: "Vocation" },
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("loads with the Ikigai zone selected", async ({ page }) => {
  await expect(page).toHaveTitle("Ikigai · A reason for being");
  await expect(page.getByRole("img", { name: "Four-circle Ikigai diagram" })).toBeVisible();
  await expect(page.locator("#zones g.zone")).toHaveCount(13);
  await expect(page.locator("#title")).toHaveText("Ikigai");
  await expect(page.locator("#chips .chip.off")).toHaveCount(0);
  await expect(page.locator("button.pill.active")).toHaveText("Ikigai");
});

for (const { zone, title } of PILLS) {
  test(`clicking the ${title} pill shows its zone`, async ({ page }) => {
    await page.locator(`button.pill[data-zone="${zone}"]`).click();
    await expect(page.locator("#title")).toHaveText(title);
    await expect(page.locator("button.pill.active")).toHaveAttribute("data-zone", zone);
    await expect(page.locator("g.zone.active")).toHaveAttribute("data-zone", zone);
  });
}

test("hovering a region updates the panel until the pointer leaves", async ({ page }) => {
  // (282, 287) lies inside the love and good-at circles only: the Passion zone.
  await moveToSvgPoint(page, 282, 287);
  await expect(page.locator("#title")).toHaveText("Passion");
  await expect(page.locator("#ikigai")).toHaveClass(/\bhovering\b/);
  await expect(page.locator("#chips .chip.off")).toHaveCount(2);

  await page.locator("h1").hover();
  await expect(page.locator("#title")).toHaveText("Ikigai");
  await expect(page.locator("#ikigai")).not.toHaveClass(/\bhovering\b/);
});

test("pressing Enter on a focused pill selects its zone", async ({ page }) => {
  await page.keyboard.press("Tab");
  await expect(page.locator('button.pill[data-zone="LGNP"]')).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator('button.pill[data-zone="LG"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#title")).toHaveText("Passion");
  await expect(page.locator("button.pill.active")).toHaveAttribute("data-zone", "LG");
});
