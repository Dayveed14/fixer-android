import { isRootScreen } from "../App";

describe("Android back button", () => {
  it.each(["/", "/fixbot", "/learn", "/help", "/c", "/t", "/a/more"])("leaves the app from the main tab %s", (path) => {
    expect(isRootScreen(path)).toBe(true);
  });

  it.each(["/login", "/register", "/c/book", "/c/repairs/3", "/learn/article/x"])("goes back (doesn't exit) from %s", (path) => {
    expect(isRootScreen(path)).toBe(false);
  });
});
