import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { UPDATER } from "../scripts/site.mjs";

const PAGE = readFileSync(new URL("../templates/air_gapped_update.html", import.meta.url), "utf8");
const SCRIPT = readFileSync(new URL("../src/js/air_gapped.ts", import.meta.url), "utf8");
const CSS = readFileSync(new URL("../src/css/style.css", import.meta.url), "utf8");

const idsInPage = new Set([...PAGE.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
const idsWanted = [...SCRIPT.matchAll(/getElementById\((?:"|')([\w-]+)(?:"|')\)/g)].map((match) => match[1]);

test("every element the page reaches for is in the markup", () => {
  const missing = [...new Set(idsWanted)].filter((id) => !idsInPage.has(id));

  assert.deepEqual(missing, [], `no markup for ${missing.join(", ")}`);
  assert.ok(idsWanted.length > 10, "the page reaches for a lot of elements; finding few means the grep broke");
});

test("nothing names an installer or a release download path", () => {
  assert.ok(!/releases?\/(latest\/)?download\//.test(PAGE + SCRIPT), "a release download path is hard-coded");
  assert.ok(!/\.AppImage|\.dmg|\.msi|\.exe|keycard-shell-updater-/.test(PAGE + SCRIPT), "an installer file name is hard-coded");
});

test("the operating systems the markup offers are the ones the sync looks for installers for", () => {
  const [, osSelect] = PAGE.match(/<select name="op-system"[^>]*>([\s\S]*?)<\/select>/) ?? [];

  assert.ok(osSelect !== undefined, "the page has no op-system select");
  assert.deepEqual(
    [...osSelect.matchAll(/value="([^"]+)">([^<]*)</g)].map(([, id, label]) => ({ id, label })),
    UPDATER.platforms.map(({ id, label }) => ({ id, label })),
  );
  assert.match(SCRIPT, /replaceChildren\(\.\.\.updaterContext\.platforms\.map/);
});

test("the button is fed by the document, and the release page stays the fallback", () => {
  const [button] = PAGE.match(/<a [^>]*id="download-app-btn"[^>]*>/) ?? [];

  assert.ok(button?.includes("https://github.com/keycard-tech/kshell-updater/releases/latest"), "the button no longer falls back to the release page");
  assert.match(SCRIPT, /appDownloadBtn\.href = platform\.url/);
  assert.match(SCRIPT, /get-updater\.json/);
});

test("the installer patterns cover the names of both naming schemes", () => {
  const offeredTo = (id: string, names: string[]) =>
    UPDATER.platforms.find((each) => each.id === id)!.patterns.some((pattern) => names.some((name) => pattern.test(name)));

  assert.ok(offeredTo("windows", ["Keycard.Shell.Updater_2.1.0_x64-setup.exe", "keycard-shell-updater-win.exe"]));
  assert.ok(offeredTo("mac", ["Keycard.Shell.Updater_2.1.0_universal.dmg", "keycard-shell-updater-mac.zip"]));
  assert.ok(offeredTo("linux", ["Keycard.Shell.Updater_2.1.0_amd64.AppImage", "keycard-shell-updater-lnx.AppImage"]));
});

test("each screenshot of the updater is one reference to a shipped file", () => {
  const shots = [...PAGE.matchAll(/keycard_shell\/img\/(updater_[\w-]+\.webp)/g)].map((match) => match[1]);

  assert.equal(shots.length, 3, `${shots.length} screenshots of the updater, expected 3`);

  for (const name of shots) {
    // Parcel turns a second reference from an <a href> into a dead one, so a shot is shown and never linked
    assert.equal(shots.filter((each) => each === name).length, 1, `${name} is referenced more than once`);
    assert.ok(existsSync(new URL(`../src/img/${name}`, import.meta.url)), `src/img/${name} is missing`);
  }
});

test("every class the page uses is in the stylesheet", () => {
  const used = new Set([...PAGE.matchAll(/class="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/)).filter(Boolean));
  const missing = [...used].filter((name) => !CSS.includes(`.${name}`));

  assert.deepEqual(missing, [], `${missing.join(", ")} used but never styled`);
});
