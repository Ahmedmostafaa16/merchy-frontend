import createApp from "@shopify/app-bridge";

let appInstance = null;
let initErrorMessage = "";
const readSearchParams = () => new URLSearchParams(window.location.search);

export const getShopParam = () => readSearchParams().get("shop") || "";
export const getHostParam = () => readSearchParams().get("host") || "";
export const getAppBridgeErrorMessage = () => initErrorMessage;

export const getAppBridge = () => {
  const hostParam = getHostParam();

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
    });
  }

  return appInstance;
};
