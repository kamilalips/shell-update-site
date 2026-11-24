// Cookie banner for Google Consent Mode. templates/base.html sets every signal to denied and applies a stored
// "granted" choice before the Google tag configures; this file collects the choice and forwards later changes.

export {};

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

// Read by the inline script in templates/base.html as well: change both together
const STORAGE_KEY = "keycard_shell_consent";

type Choice = "granted" | "denied";

// Google only reads the Arguments object, an array pushed to dataLayer is ignored
function gtag(..._signature: unknown[]): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
}

function readChoice(): Choice | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return stored === "granted" || stored === "denied" ? stored : undefined;
  } catch {
    return undefined;
  }
}

function saveChoice(choice: Choice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Storage is blocked: the choice holds for this page and the banner asks again on the next one
  }
}

function applyChoice(choice: Choice): void {
  gtag("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });
}

function wireConsentBanner(): void {
  const banner = document.getElementById("consent-banner") as HTMLDivElement | null;
  const accept = document.getElementById("consent-accept") as HTMLButtonElement | null;
  const decline = document.getElementById("consent-decline") as HTMLButtonElement | null;
  const settings = document.getElementById("cookie-settings") as HTMLButtonElement | null;

  if (banner === null || accept === null || decline === null) return;

  const choose = (choice: Choice): void => {
    saveChoice(choice);
    applyChoice(choice);
    banner.hidden = true;
    // The choice was made in the banner, so the keyboard user picks up again where they were
    settings?.focus({ preventScroll: true });
  };

  accept.addEventListener("click", () => choose("granted"));
  decline.addEventListener("click", () => choose("denied"));

  settings?.addEventListener("click", () => {
    banner.hidden = false;
    banner.focus();
  });

  // A first visit has no choice yet, so the banner is the only thing that can start tracking
  if (readChoice() === undefined) banner.hidden = false;
}

wireConsentBanner();
