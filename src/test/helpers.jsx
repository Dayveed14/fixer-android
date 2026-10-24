import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { FeedbackProvider } from "../ui";

export function Where() {
  const { pathname, search } = useLocation();
  return <p data-testid="where">{pathname + search}</p>;
}

/** Renders `element` at `path` (matching `pattern`), with a catch-all that shows where navigation went. */
export function renderAt(element, { path = "/", pattern = path } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <FeedbackProvider>
        <Routes>
          <Route path={pattern} element={element} />
          <Route path="*" element={<Where />} />
        </Routes>
      </FeedbackProvider>
    </MemoryRouter>,
  );
}
