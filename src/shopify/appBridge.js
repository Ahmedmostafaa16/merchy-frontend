import createApp from "@shopify/app-bridge";

let appInstance = null;
let initErrorMessage = "";

const params = new URLSearchParams(window.location.search);
const shopParam = params.get("shop") || "";
const hostParam = params.get("host") || "";

export const getShopParam = () => shopParam;
export const getHostParam = () => hostParam;
export const getAppBridgeErrorMessage = () => initErrorMessage;

export const getAppBridge = () => {
  if (!hostParam) {
    initErrorMessage = "This app must be opened from Shopify Admin";
    return null;
  }

  if (!process.env.REACT_APP_SHOPIFY_API_KEY) {
    initErrorMessage = "Missing REACT_APP_SHOPIFY_API_KEY";
    return null;
  }

  if (!appInstance) {
    appInstance = createApp({
      apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
      host: hostParam,
      forceRedirect: true,
    });
  }

  return appInstance;
};
