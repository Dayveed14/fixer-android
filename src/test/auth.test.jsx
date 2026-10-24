import { vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(async () => ({ data: [] })), patch: vi.fn() }));
vi.mock("../core/api/client", async (orig) => ({ ...(await orig()), default: api }));

import App from "../App";
import { FeedbackProvider } from "../ui";
import { clearSession, getSession, setSession } from "../core/session";
import { changePassword } from "../core/api/auth.api";
import { passwordFormProblem } from "../screens/shared/ChangePassword";

const renderApp = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </MemoryRouter>,
  );

beforeEach(async () => {
  await clearSession();
  api.post.mockReset();
  api.get.mockReset().mockResolvedValue({ data: [] });
});

it("guests opening a signed-in screen are sent to sign in", async () => {
  renderApp("/c/repairs");
  expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
});

it("signing in stores the token and opens the right home for the role", async () => {
  api.post.mockResolvedValueOnce({ data: { id: 2, first_name: "Tobi", role: "technician", email: "t@x.com", token: "tok" } });
  renderApp("/login");
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "t@x.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password-123" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Hi Tobi")).toBeInTheDocument();
  expect(getSession()).toEqual({ token: "tok", user: { id: 2, first_name: "Tobi", role: "technician", email: "t@x.com" } });
  expect(screen.getByRole("link", { name: /Repairs/ })).toHaveAttribute("href", "/t/repairs");
});

it("shows the server's message when sign in fails", async () => {
  api.post.mockRejectedValueOnce(Object.assign(new Error("Incorrect email or password."), { status: 401 }));
  renderApp("/login");
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@x.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "nope" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
});

it("a signed-in customer can't open admin screens", async () => {
  await setSession({ token: "t", user: { id: 3, first_name: "Ada", role: "user", email: "a@x.com" } });
  renderApp("/a/pricing");
  expect(await screen.findByText("Hi Ada")).toBeInTheDocument();
});

it("changing the password swaps in the fresh token", async () => {
  await setSession({ token: "old", user: { id: 3, role: "user" } });
  api.patch.mockResolvedValueOnce({ data: { message: "ok", token: "new" } });
  await changePassword({ currentPassword: "a", newPassword: "b" });
  expect(api.patch).toHaveBeenCalledWith("/api/users/me/password", { current_password: "a", new_password: "b" });
  expect(getSession().token).toBe("new");
});

it.each([
  [{ current: "", next: "new-password", confirm: "new-password" }, /current password/],
  [{ current: "x", next: "short", confirm: "short" }, /8 to 72/],
  [{ current: "same-pass-1", next: "same-pass-1", confirm: "same-pass-1" }, /haven't just used/],
  [{ current: "x", next: "new-password", confirm: "other-password" }, /don't match/],
])("password rules match the server %#", (form, msg) => expect(passwordFormProblem(form)).toMatch(msg));

it("a session expiring mid-use returns to sign in with a notice", async () => {
  await setSession({ token: "t", user: { id: 3, first_name: "Ada", role: "user", email: "a@x.com" } });
  renderApp("/c/account");
  await screen.findByText("Change password");
  // What the API client does on a 401:
  await clearSession("expired");
  window.dispatchEvent(new CustomEvent("fixer:session-expired"));
  await waitFor(() => expect(screen.getByText(/Your session ended/)).toBeInTheDocument());
});
