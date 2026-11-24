// The cookie banner is the Shopify privacy banner, the one docs.keycard.tech and the store use, so a visitor answers once for
// every keycard.tech site: Shopify keeps the choice in the _tracking_consent cookie on keycard.tech.
// templates/base.html sets every Google Consent Mode signal to denied and forwards the banner's events to Google.

export {};

declare global {
  interface Window {
    privacyBanner?: {
      loadBanner: (config: BannerConfig) => void;
      showPreferences: () => void;
    };
  }
}

type BannerConfig = {
  storefrontAccessToken: string;
  checkoutRootDomain: string;
  storefrontRootDomain: string;
  headlessStorefront: boolean;
};

const BANNER_SRC = "https://cdn.shopify.com/shopifycloud/privacy-banner/storefront-banner.js";

// Same values as docs.keycard.tech. The Storefront token is public by design: it ships in the HTML of docs.keycard.tech
const BANNER_CONFIG: BannerConfig = {
  storefrontAccessToken: "f83f862d5e662548917408f1f0384d5f",
  checkoutRootDomain: "getmykeycard.myshopify.com",
  storefrontRootDomain: "keycard.tech",
  headlessStorefront: true,
};

function loadBanner(): void {
  const script = document.createElement("script");

  script.src = BANNER_SRC;
  script.async = true;
  script.addEventListener("load", () => window.privacyBanner?.loadBanner(BANNER_CONFIG));
  document.head.appendChild(script);
}

// The footer entry lets a visitor change or withdraw the choice made earlier
document.getElementById("cookie-settings")?.addEventListener("click", () => window.privacyBanner?.showPreferences());

loadBanner();
