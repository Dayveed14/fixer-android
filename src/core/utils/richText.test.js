import { describe, it, expect } from "vitest";
import { toRichHtml } from "./richText";

describe("toRichHtml", () => {
  it("turns blank lines into paragraphs and keeps line breaks", () => {
    expect(toRichHtml("First para\nline two\n\nSecond para")).toBe(
      "<p>First para<br />line two</p><p>Second para</p>",
    );
  });

  it("escapes typed HTML-ish text in plain content", () => {
    expect(toRichHtml("Use 2 < 3 & press <Enter>")).toBe("<p>Use 2 &lt; 3 &amp; press &lt;Enter&gt;</p>");
  });

  it("keeps legacy TinyMCE HTML but strips scripts and handlers", () => {
    const html = toRichHtml('<p onclick="x()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>');
    expect(html).toBe('<p>Hi</p><a href="#">x</a>');
  });

  it("handles empty content", () => {
    expect(toRichHtml("")).toBe("");
    expect(toRichHtml(null)).toBe("");
  });
});
