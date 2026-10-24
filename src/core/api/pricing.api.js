import api from "./client";

// Admin pricing engine — call prices, Abuja pickup zones, settings.
export const getPricing = () => api.get("/api/pricing").then((r) => r.data);

export const saveSupportTypes = (items) =>
  api.put("/api/pricing/support-types", { items }).then((r) => r.data);

export const saveZones = (zones) =>
  api.put("/api/pricing/zones", { zones }).then((r) => r.data);

export const saveSettings = (settings) =>
  api.put("/api/pricing/settings", settings).then((r) => r.data);
