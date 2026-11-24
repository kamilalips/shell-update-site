// The Google tag is only compliant if the denied default is in the queue before the tag configures, on every page

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PAGES } from "../scripts/site.mjs";

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const BASE = read("templates/base.html");
const FOOTER = read("templates/footer.html");
const SCRIPT = read("src/js/consent.ts");

const TAG_ID = "G-YLHJYKZLH6";
const SIGNALS = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"];

test("every page is built on the base template, so the tag is in the <head> of all of them", () => {
  const apart = PAGES.filter((page) => !read(`templates/${page.template}`).startsWith("{% extends './base.html' %}")).map((page) => page.template);

  assert.deepEqual(apart, [], `${apart.join(", ")} does not extend base.html`);
  assert.equal(BASE.match(/<head>[\s\S]*<\/head>/)?.[0].includes(`googletagmanager.com/gtag/js?id=${TAG_ID}`), true, "the tag is not inside <head>");
});

test("all four signals default to denied before the tag is configured or loaded", () => {
  const defaults = BASE.indexOf("gtag('consent', 'default'");
  const config = BASE.indexOf(`gtag('config', '${TAG_ID}')`);
  const loader = BASE.indexOf("googletagmanager.com/gtag/js");

  assert.ok(defaults !== -1 && config !== -1 && loader !== -1, "consent default, config or loader is missing");
  assert.ok(defaults < config, "config runs before the consent default");
  assert.ok(defaults < loader, "the tag loads before the consent default");

  const block = BASE.slice(defaults, BASE.indexOf("});", defaults));

  for (const signal of SIGNALS) assert.match(block, new RegExp(`${signal}: 'denied'`), `${signal} does not default to denied`);
});

test("the banner's events reach Google through a consent update, and are listened for before the banner loads", () => {
  assert.match(BASE, /addEventListener\('visitorConsentCollected'/);
  assert.match(BASE, /addEventListener\('consentTrackingApiLoaded'/);
  assert.match(BASE, /analytics_storage: analytics \? 'granted' : 'denied'/);
  assert.match(BASE, /ad_storage: marketing \? 'granted' : 'denied'/);
  assert.match(BASE, /ad_user_data: marketing/);
  assert.match(BASE, /ad_personalization: marketing/);
  assert.ok(!BASE.includes("storefront-banner.js"), "the banner must be loaded by consent.ts, after the listeners above");
});

// A choice kept anywhere but the shared cookie would ask a visitor again on every keycard.tech site
test("the banner is configured for the whole keycard.tech domain, like docs", () => {
  assert.match(SCRIPT, /storefrontRootDomain: "keycard\.tech"/);
  assert.match(SCRIPT, /checkoutRootDomain: "getmykeycard\.myshopify\.com"/);
  assert.match(SCRIPT, /headlessStorefront: true/);
  assert.ok(!/localStorage|document\.cookie/.test(SCRIPT + BASE), "a second place keeps the choice");
});

test("every element the banner script reaches for is in the markup", () => {
  const ids = new Set([...FOOTER.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
  const wanted = [...SCRIPT.matchAll(/getElementById\("([^"]+)"\)/g)].map((match) => match[1]);

  assert.deepEqual(wanted.filter((id) => !ids.has(id)), []);
  assert.equal(wanted.length, 1, "the footer entry is the only element consent.ts reaches for");
});
