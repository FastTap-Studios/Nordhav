import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000/";
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGE: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`CONSOLE: ${m.text()}`);
});
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(3000);
const root = await page.locator("#root").innerText().catch(() => "");
console.log("URL:", url);
console.log("ROOT preview:", root.slice(0, 300));
console.log("ERRORS:", errors.length ? errors.join("\n") : "none");
await browser.close();
