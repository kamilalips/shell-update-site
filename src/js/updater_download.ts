import { UIUtils } from "./ui_utils";

export interface UpdaterElements {
    selector: HTMLSelectElement;
    button: HTMLAnchorElement;
    label: HTMLSpanElement;
    asset: HTMLSpanElement;
}

export async function wireUpdaterDownload(mediaPrefix: string, elements: UpdaterElements) : Promise<void> {
    const context: UIUtils.UpdaterContext = await fetch(mediaPrefix + "get-updater.json").then((r: any) => r.json());

    function show() : void {
        const platform = context.platforms.find((each) => each.id === elements.selector.value) ?? context.platforms[0];

        elements.label.innerHTML = `Download Shell Updater ${context.version}`;
        elements.asset.innerHTML = platform.asset;
        elements.button.href = platform.url;
    }

    // The options in the markup are what a visitor without JavaScript is left with; the release decides which operating systems have an installer
    elements.selector.replaceChildren(...context.platforms.map((platform) => new Option(platform.label, platform.id)));

    const detected = UIUtils.getOS();

    elements.selector.value = context.platforms.some((each) => each.id === detected) ? detected : context.platforms[0].id;

    // The markup's href is the release page, worth a tab of its own; a direct installer download is not
    elements.button.removeAttribute("target");

    show();
    elements.selector.addEventListener("change", show);
}
