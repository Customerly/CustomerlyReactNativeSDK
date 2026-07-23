import { abstractify } from "../html";

describe("abstractify", () => {
  it("returns an attachment placeholder for empty input", () => {
    expect(abstractify()).toBe("📎 Attachment");
    expect(abstractify(undefined)).toBe("📎 Attachment");
  });

  it("returns an image placeholder when the content is only markup", () => {
    expect(abstractify("<img src='x.png' />")).toBe("🖼 Image");
  });

  it("strips HTML tags and keeps the text", () => {
    expect(abstractify("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("decodes HTML entities", () => {
    expect(abstractify("Tom &amp; Jerry &lt;3")).toBe("Tom & Jerry <3");
  });

  it("truncates long text to 100 characters with an ellipsis", () => {
    const long = "a".repeat(150);
    const result = abstractify(long);

    expect(result.endsWith("...")).toBe(true);
    expect(result).toHaveLength(103);
  });
});
