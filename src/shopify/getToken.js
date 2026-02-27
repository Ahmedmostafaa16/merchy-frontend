import { getSessionToken } from "@shopify/app-bridge-utils";
import { getAppBridge, getAppBridgeErrorMessage } from "./appBridge";

export const getFreshSessionToken = async () => {
  const app = getAppBridge();

  if (!app) {
    throw new Error(getAppBridgeErrorMessage() || "Unable to initialize Shopify App Bridge");
  }

  return getSessionToken(app);
};
