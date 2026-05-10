import createApp from "@shopify/app-bridge";
import { Redirect } from "@shopify/app-bridge/actions";

let appInstance = null;
let appHost = "";
let initErrorMessage = "";
let outsideAdminOpenDispatched = false;
const SHOP_STORAGE_KEY = "shopify_shop";
const HOST_STORAGE_KEY = "shopify_host";
const readSearchParams = () => new URLSearchParams(window.location.search);
const isRunningInsideFrame = () => {
  try {
    return window.top !== window.self;
  } catch (_error) {
    return true;
  }
};

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

export const openCurrentPageOutsideShopifyAdmin = () => {
  if (outsideAdminOpenDispatched || !isRunningInsideFrame()) {
    return false;
  }

  const app = getAppBridge();
  if (!app) {
    return false;
  }

  outsideAdminOpenDispatched = true;

  try {
    const redirect = Redirect.create(app);
    redirect.dispatch(Redirect.Action.REMOTE, {
      url: window.location.href,
      newContext: true,
    });
  } catch (_error) {
    window.open(window.location.href, "_top");
  }

  return true;
};
