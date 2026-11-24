// The Google tag is only compliant if the denied default is in the queue before the tag configures, on every page

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PAGES } from "../scripts/site.mjs";

const read = (path: string): string => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const BASE = read("templates/base.html");
const BANNER = read("templates/consent_banner.html");
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

test("the head script and the banner script read and write the same stored choice", () => {
  const key = SCRIPT.match(/STORAGE_KEY = "([^"]+)"/)?.[1];

  assert.ok(key, "no storage key in consent.ts");
  assert.ok(BASE.includes(`localStorage.getItem('${key}') === 'granted'`), "base.html reads another key than consent.ts writes");
});

test("accepting and declining both update every signal", () => {
  for (const signal of SIGNALS) assert.match(SCRIPT, new RegExp(`${signal}: choice`), `${signal} is not updated`);
  assert.match(SCRIPT, /choose\("granted"\)/);
  assert.match(SCRIPT, /choose\("denied"\)/);
});

test("every element the banner script reaches for is in the markup", () => {
  const ids = new Set([...(BANNER + FOOTER).matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
  const wanted = [...SCRIPT.matchAll(/getElementById\("([^"]+)"\)/g)].map((match) => match[1]);

  assert.deepEqual(wanted.filter((id) => !ids.has(id)), []);
  assert.ok(wanted.length === 4, "the banner is expected to reach for the banner, two buttons and the footer entry");
});

// Without JS the banner can not be answered, so it must not cover the page until the script has decided to show it
test("the banner starts hidden", () => {
  assert.match(BANNER, /id="consent-banner"[^>]*\shidden>/);
});
