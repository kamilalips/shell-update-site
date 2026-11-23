// Both air-gapped pages wire every download button at runtime, so these read the templates and the scripts instead of running them

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { PAGES, UPDATER, URLS } from "../scripts/site.mjs";

const CSS = readFileSync(new URL("../src/css/style.css", import.meta.url), "utf8");
const VERIFY = readFileSync(new URL("../templates/verify.html", import.meta.url), "utf8");
const HELPER = readFileSync(new URL("../src/js/updater_download.ts", import.meta.url), "utf8");

const pages = [
  { name: "update", template: "air_gapped_update.html", script: "air_gapped.ts", shots: 3 },
  { name: "verify", template: "air_gapped_verify.html", script: "air_gapped_verify.ts", shots: 1 },
];

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

for (const page of pages) {
  const markup = read(`templates/${page.template}`);
  const script = read(`src/js/${page.script}`);

  test(`every element the ${page.name} page reaches for is in its markup`, () => {
    const ids = new Set([...markup.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
    const wanted = [...script.matchAll(/getElementById\((?:"|')([\w-]+)(?:"|')\)/g)].map((match) => match[1]);
    const missing = [...new Set(wanted)].filter((id) => !ids.has(id));

    assert.deepEqual(missing, [], `no markup for ${missing.join(", ")}`);
    assert.ok(wanted.length > 3, "finding almost nothing means the grep broke");
  });

  // The updater renamed every asset between v1.0.0 and v2.0.0 and the hard-coded links 404ed; get-updater.json is what names an installer now
  test(`the ${page.name} page names no installer and no release download path`, () => {
    assert.ok(!/releases?\/(latest\/)?download\//.test(markup + script), "a release download path is hard-coded");
    assert.ok(!/\.AppImage|\.dmg|\.msi|\.exe|keycard-shell-updater-/.test(markup + script), "an installer file name is hard-coded");
    assert.match(script, /wireUpdaterDownload\(/);
  });

  // The markup is what a visitor without JavaScript sees, and what the page replaces comes from UPDATER
  test(`the ${page.name} page offers the operating systems the sync looks for installers for`, () => {
    const [, osSelect] = markup.match(/<select name="op-system"[^>]*>([\s\S]*?)<\/select>/) ?? [];

    assert.ok(osSelect !== undefined, "the page has no op-system select");
    assert.deepEqual(
      [...osSelect.matchAll(/value="([^"]+)">([^<]*)</g)].map(([, id, label]) => ({ id, label })),
      UPDATER.platforms.map(({ id, label }) => ({ id, label })),
    );
  });

  test(`the ${page.name} page falls back to the release page and takes the installer from the document`, () => {
    const [button] = markup.match(/<a [^>]*id="download-app-btn"[^>]*>/) ?? [];

    assert.ok(button?.includes("https://github.com/keycard-tech/kshell-updater/releases/latest"), "the button no longer falls back to the release page");
    assert.equal([...markup.matchAll(/get-updater\.json/g)].length, 0, "a page fetches the updater document itself; updater_download.ts is the one that does");
  });

  test(`the ${page.name} page shows ${page.shots} screenshots of the updater, each referenced once`, () => {
    const shots = [...markup.matchAll(/keycard_shell\/img\/(updater_[\w-]+\.webp)/g)].map((match) => match[1]);

    assert.equal(shots.length, page.shots, `${shots.length} screenshots, expected ${page.shots}`);

    for (const name of shots) {
      // Parcel turns a second reference from an <a href> into a dead one, so a shot is shown and never linked
      assert.equal(shots.filter((each) => each === name).length, 1, `${name} is referenced more than once`);
      assert.ok(existsSync(new URL(`../src/img/${name}`, import.meta.url)), `src/img/${name} is missing`);
    }
  });

  test(`every class the ${page.name} page uses is in the stylesheet`, () => {
    const used = new Set([...markup.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/)).filter(Boolean));
    const missing = [...used].filter((name) => !CSS.includes(`.${name}`));

    assert.deepEqual(missing, [], `${missing.join(", ")} used but never styled`);
  });
}

test("one module hands out the installer to both pages", () => {
  assert.equal([...HELPER.matchAll(/get-updater\.json/g)].length, 1);
  assert.match(HELPER, /replaceChildren\(\.\.\.context\.platforms\.map/);
  assert.match(HELPER, /button\.removeAttribute\("target"\)/);
});

test("the installer patterns cover the names of both naming schemes", () => {
  const offeredTo = (id: string, names: string[]) =>
    UPDATER.platforms.find((each) => each.id === id)!.patterns.some((pattern) => names.some((name) => pattern.test(name)));

  assert.ok(offeredTo("windows", ["Keycard.Shell.Updater_2.1.0_x64-setup.exe", "keycard-shell-updater-win.exe"]));
  assert.ok(offeredTo("mac", ["Keycard.Shell.Updater_2.1.0_universal.dmg", "keycard-shell-updater-mac.zip"]));
  assert.ok(offeredTo("linux", ["Keycard.Shell.Updater_2.1.0_amd64.AppImage", "keycard-shell-updater-lnx.AppImage"]));
});

// The browser check needs a camera and an online machine; the app needs neither, so the choice goes under its Continue button
test("the verify page offers the air-gapped verification under its Continue button", () => {
  const page = PAGES.find((each) => each.template === "air_gapped_verify.html");
  const want = page?.path.replace(/index\.html$/, "").replace(/\/$/, "");
  const url = Object.entries(URLS).find(([, path]) => path === want)?.[0];
  const [step] = VERIFY.match(/id="kpro_web__verify-step1"[\s\S]*?id="kpro_web__verify-step2"/) ?? [];

  assert.ok(url !== undefined, "verify/air-gapped is in PAGES under no URL name");
  assert.ok(step !== undefined, "the verify page has no first step to read");

  const [button, link] = [step.indexOf('value="Continue"'), step.indexOf(`href="{% url '${url}' %}"`)];

  assert.ok(button >= 0, "the first step has no Continue button");
  assert.ok(link > button, "the air-gapped verification link is not under the Continue button");
  assert.match(step.slice(button, link), /keycard_shell_or/, "nothing tells the visitor these are two separate ways to verify");
});
