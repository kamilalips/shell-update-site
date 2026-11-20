import { UIUtils } from "./ui_utils";

const mediaPrefix = document.getElementById('update__media-prefix') as HTMLInputElement;

const osSelector = document.getElementById("op-system-selector") as HTMLSelectElement;

const appDownloadBtn = document.getElementById("download-app-btn") as HTMLAnchorElement;
const appBtnLabel = document.getElementById("download-app-label") as HTMLSpanElement;
const appAsset = document.getElementById("app-asset") as HTMLSpanElement;

const fwVariants = document.getElementById("fw-variant-selector") as HTMLSelectElement;
const fwDownloadBtn = document.getElementById("download-fw") as HTMLAnchorElement;
const fwChangelogBtn = document.getElementById("fw-changelog") as HTMLAnchorElement;
const fwHash = document.getElementById("fw-hash") as HTMLSpanElement;
const fwBtnLabel = document.getElementById("download-fw-label") as HTMLSpanElement;

const dbDownloadBtn = document.getElementById("download-db") as HTMLAnchorElement;
const dbChangelogBtn = document.getElementById("db-changelog") as HTMLAnchorElement;
const dbHash = document.getElementById("db-hash") as HTMLSpanElement;
const dbBtnLabel = document.getElementById("download-db-label") as HTMLSpanElement;

let firmwareContext: UIUtils.FirmwareContext;
let updaterContext: UIUtils.UpdaterContext;

function showApp() : void {
    const platform = updaterContext.platforms.find((each) => each.id === osSelector.value) ?? updaterContext.platforms[0];

    appBtnLabel.innerHTML = `Download Shell Updater ${updaterContext.version}`;
    appAsset.innerHTML = platform.asset;
    appDownloadBtn.href = platform.url;
}

function showFirmware() : void {
    const variant = firmwareContext.variants.find((each) => each.id === fwVariants.value) ?? firmwareContext.variants[0];

    fwBtnLabel.innerHTML = `Download Firmware ${UIUtils.firmwareTitle(firmwareContext, variant)}`;
    fwHash.innerHTML = variant.hash;
    fwDownloadBtn.href = mediaPrefix.value + variant.path;
}

async function handleAirGappedUpdate() : Promise<void> {
    firmwareContext = await fetch(mediaPrefix.value + "get-firmware.json").then((r: any) => r.json());
    const dbContext = await fetch(mediaPrefix.value + "get-db.json").then((r: any) => r.json());
    updaterContext = await fetch(mediaPrefix.value + "get-updater.json").then((r: any) => r.json());

    osSelector.replaceChildren(...updaterContext.platforms.map((platform) => new Option(platform.label, platform.id)));

    const detected = UIUtils.getOS();

    osSelector.value = updaterContext.platforms.some((each) => each.id === detected) ? detected : updaterContext.platforms[0].id;

    appDownloadBtn.removeAttribute("target");

    showApp();
    osSelector.addEventListener("change", showApp);

    for(const variant of firmwareContext.variants) fwVariants.add(new Option(UIUtils.firmwareTitle(firmwareContext, variant), variant.id));

    showFirmware();
    fwVariants.addEventListener("change", showFirmware);

    dbBtnLabel.innerHTML = `Download Database ${dbContext["version"]}`;
    dbHash.innerHTML = dbContext["hash"];
    dbDownloadBtn.href = mediaPrefix.value + dbContext["db_path"];

    fwChangelogBtn.href += `fw-rn-${firmwareContext.version}`;
    dbChangelogBtn.href += `db-version-container-${dbContext["version"]}`;
}

handleAirGappedUpdate();
