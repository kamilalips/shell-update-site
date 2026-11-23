import { UIUtils } from "./ui_utils";
import { wireUpdaterDownload } from "./updater_download";

const mediaPrefix = document.getElementById('verify__media-prefix') as HTMLInputElement;

const appElements = {
    selector: document.getElementById("op-system-selector") as HTMLSelectElement,
    button: document.getElementById("download-app-btn") as HTMLAnchorElement,
    label: document.getElementById("download-app-label") as HTMLSpanElement,
    asset: document.getElementById("app-asset") as HTMLSpanElement,
};

const unitsBtn = document.getElementById("download-units") as HTMLAnchorElement;
const unitsBtnLabel = document.getElementById("download-units-label") as HTMLSpanElement;
const unitsHash = document.getElementById("units-hash") as HTMLSpanElement;

async function handleAirGappedVerify() : Promise<void> {
    await wireUpdaterDownload(mediaPrefix.value, appElements);

    const unitsContext: UIUtils.UnitsContext | undefined = await fetch(mediaPrefix.value + "get-units.json").then((r: any) => r.json()).catch(() => undefined);
    const list = unitsContext?.variants?.[0];

    if (unitsContext === undefined || list === undefined) return;

    unitsBtnLabel.innerHTML = `Download produced units list ${unitsContext.version}`;
    unitsHash.innerHTML = list.hash;
    unitsBtn.href = mediaPrefix.value + list.path;
    unitsBtn.removeAttribute("target");
}

handleAirGappedVerify();
