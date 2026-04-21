import createApp from "@shopify/app-bridge";
import { Redirect } from "@shopify/app-bridge/actions";

let appInstance = null;
let appHost = "";
let initErrorMessage = "";
const SHOP_STORAGE_KEY = "shopify_shop";
const HOST_STORAGE_KEY = "shopify_host";
const readSearchParams = () => new URLSearchParams(window.location.search);

export const getShopParam = () => {
  const shop = readSearchParams().get("shop") || window.sessionStorage.getItem(SHOP_STORAGE_KEY) || "";
  if (shop) {
    window.sessionStorage.setItem(SHOP_STORAGE_KEY, shop);
  }
  return shop;
};

export const getHostParam = () => {
  const host = readSearchParams().get("host") || window.sessionStorage.getItem(HOST_STORAGE_KEY) || "";
  if (host) {
    window.sessionStorage.setItem(HOST_STORAGE_KEY, host);
  }
  return host;
};

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

  if (!appInstance || appHost !== hostParam) {
    appInstance = createApp({
      apiKey: process.env.REACT_APP_SHOPIFY_API_KEY,
      host: hostParam,
      forceRedirect: true,
    });
    appHost = hostParam;
  }

  return appInstance;
};

export const redirectToRemote = (url) => {
  const app = getAppBridge();

  if (app) {
    const redirect = Redirect.create(app);
    redirect.dispatch(Redirect.Action.REMOTE, url);
    return;
  }

  window.location.assign(url);
};
