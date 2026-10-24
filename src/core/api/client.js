import axios from "axios";
import { clearSession, getToken } from "../session";

/* ===========================
   API CLIENT — adapted from the web app's src/api/client.js.
   Differences for the APK:
   - Auth: "Authorization: Bearer <token>" from the stored session
     (no cookies, no withCredentials).
   - Every request carries X-Fixer-Client: android (the backend's CSRF
     guard accepts it, and login then returns the token).
   - Session expiry: a 401 clears the session and fires
     "fixer:session-expired"; the app shell sends the user to sign in.
   Errors, timeouts and messages are the same as the web app.
=========================== */

const FALLBACK_BASE_URL = "https://fixer-backend-7mng.onrender.com";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL).replace(/\/+$/, "");

export const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 30000;

export const TIMEOUTS = {
  diagnosis: 45000,
  upload: 120000,
};

const AUTH_ENDPOINTS = ["/api/users/login", "/api/users/register"];

export class ApiError extends Error {
  constructor({ message, status = 0, code = null, data = null, isNetworkError = false, isTimeout = false, response = undefined }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
    this.response = response;
  }
}

const STATUS_MESSAGES = {
  400: "Some of the information sent was invalid.",
  401: "Please sign in to continue.",
  402: "Payment could not be verified.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with an existing record.",
  413: "That file or request is too large.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our side. Please try again.",
  502: "The server is temporarily unavailable. Please try again.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The server took too long to respond. Please try again.",
};

export function toApiError(error) {
  if (error instanceof ApiError) return error;
  if (axios.isCancel?.(error) || error?.code === "ERR_CANCELED") {
    return new ApiError({ message: "Request cancelled.", code: "CANCELLED" });
  }
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return new ApiError({
      message: "The server is taking too long to respond. Check your connection and try again.",
      code: "TIMEOUT",
      isTimeout: true,
    });
  }
  const response = error?.response;
  if (!response) {
    return new ApiError({
      message: "Can't reach Fixer. Check your internet connection and try again.",
      code: "NETWORK_ERROR",
      isNetworkError: true,
    });
  }
  const data = response.data;
  let serverMessage = data && typeof data === "object" && typeof data.message === "string" ? data.message : null;
  // A backend from before 24 Oct 2026 doesn't know the Android app and
  // its security check answers every sign-in, FixBot run or booking with
  // "Request blocked."
  if (response.status === 403 && serverMessage === "Request blocked.") {
    serverMessage = "The Fixer server needs an update before the app can do this. Please try again later.";
  }
  return new ApiError({
    message: serverMessage || STATUS_MESSAGES[response.status] || `Request failed (${response.status}).`,
    status: response.status,
    code: (data && typeof data === "object" && data.code) || null,
    data,
    response,
  });
}

export { getStoredUser } from "../session";

export function createApiClient(options = {}) {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: DEFAULT_TIMEOUT_MS,
    headers: { Accept: "application/json" },
    ...options,
  });

  instance.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    config.headers["X-Fixer-Client"] = "android";
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const url = error?.config?.url || "";
      if (error?.response?.status === 401 && getToken() && !AUTH_ENDPOINTS.some((p) => url.includes(p))) {
        clearSession("expired");
        window.dispatchEvent(new CustomEvent("fixer:session-expired"));
      }
      return Promise.reject(toApiError(error));
    },
  );

  return instance;
}

const api = createApiClient();
export default api;
