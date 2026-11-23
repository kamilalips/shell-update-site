// A page Parcel does not build renders happily in pages/ and 404s in dist/, which only a full build shows

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PAGES } from "../scripts/site.mjs";

const { source } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Parcel is told to build every page", () => {
  const unbuilt = PAGES.map((page) => `pages/${page.path}`).filter((path) => !source.includes(path));

  assert.deepEqual(unbuilt, [], `${unbuilt.join(", ")} is rendered but not in package.json source`);
  assert.deepEqual(source.filter((entry: string) => !PAGES.some((page) => `pages/${page.path}` === entry)), [], "package.json source names a page nothing renders");
});
