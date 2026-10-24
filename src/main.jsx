import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./ui/theme.css";
import "./ui/components.css";
import "./screens/screens.css";
import { loadSession } from "./core/session";
import { hideSplash, setSystemBars } from "./core/native";
import { FeedbackProvider } from "./ui";
import App from "./App";

// The saved session is read before the first screen renders, so a
// signed-in user opens straight into their dashboard.
loadSession().then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </BrowserRouter>
    </StrictMode>,
  );
  setSystemBars({ onDark: true });
  hideSplash();
});
