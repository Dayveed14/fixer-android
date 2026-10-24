import { vi } from "vitest";
import { createApiClient, toApiError } from "../core/api/client";
import { clearSession, getSession, setSession } from "../core/session";

function clientReturning(status, data = {}) {
  const seen = [];
  const api = createApiClient({
    adapter: async (config) => {
      seen.push(config);
      if (status >= 400) {
        const err = new Error("fail");
        err.config = config;
        err.response = { status, data, config, headers: {} };
        throw err;
      }
      return { status, data, config, headers: {}, statusText: "OK" };
    },
  });
  return { api, seen };
}

afterEach(() => clearSession());

it("identifies as the Android app and sends the token as a Bearer header", async () => {
  await setSession({ token: "abc.def", user: { id: 1, role: "user" } });
  const { api, seen } = clientReturning(200);
  await api.get("/api/users/me");
  expect(seen[0].headers["X-Fixer-Client"]).toBe("android");
  expect(seen[0].headers.Authorization).toBe("Bearer abc.def");
  expect(seen[0].withCredentials).toBeFalsy();
});

it("sends no Authorization header when signed out", async () => {
  const { api, seen } = clientReturning(200);
  await api.get("/api/bookings/support-types");
  expect(seen[0].headers.Authorization).toBeUndefined();
});

it("a 401 ends the session and tells the app to show sign in", async () => {
  await setSession({ token: "old", user: { id: 1, role: "user" } });
  const expired = vi.fn();
  window.addEventListener("fixer:session-expired", expired);
  const { api } = clientReturning(401, { message: "Session ended. Please log in again." });

  await expect(api.get("/api/users/me")).rejects.toMatchObject({ status: 401, message: "Session ended. Please log in again." });
  expect(getSession().token).toBeNull();
  expect(expired).toHaveBeenCalled();
  window.removeEventListener("fixer:session-expired", expired);
});

it("a wrong password on login is not treated as an expired session", async () => {
  const expired = vi.fn();
  window.addEventListener("fixer:session-expired", expired);
  const { api } = clientReturning(401, { message: "Incorrect email or password." });
  await expect(api.post("/api/users/login", {})).rejects.toMatchObject({ message: "Incorrect email or password." });
  expect(expired).not.toHaveBeenCalled();
  window.removeEventListener("fixer:session-expired", expired);
});

it("turns network failures into a readable error", async () => {
  const api = createApiClient({
    adapter: async (config) => {
      const err = new Error("Network Error");
      err.config = config;
      throw err;
    },
  });
  await expect(api.get("/x")).rejects.toMatchObject({ isNetworkError: true, message: expect.stringMatching(/internet connection/) });
});

it("explains an outdated backend instead of showing 'Request blocked.'", () => {
  const err = toApiError({ response: { status: 403, data: { message: "Request blocked." } } });
  expect(err.message).toMatch(/server needs an update/);
  expect(err.status).toBe(403);
});

it("keeps every other 403 message as the server wrote it", () => {
  const err = toApiError({ response: { status: 403, data: { message: "You do not have permission to view this ticket." } } });
  expect(err.message).toBe("You do not have permission to view this ticket.");
});
