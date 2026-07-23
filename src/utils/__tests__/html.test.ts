import { abstractify } from "../html";

describe("abstractify", () => {
  describe("placeholders", () => {
    it("returns an attachment placeholder for missing input", () => {
      expect(abstractify()).toBe("📎 Attachment");
      expect(abstractify(undefined)).toBe("📎 Attachment");
    });

    it("returns an attachment placeholder for an empty string", () => {
      expect(abstractify("")).toBe("📎 Attachment");
    });

    it("returns an image placeholder when the content is only markup", () => {
      expect(abstractify("<img src='x.png' />")).toBe("🖼 Image");
    });

    it("returns an image placeholder for whitespace-only content", () => {
      expect(abstractify("   \n\t  ")).toBe("🖼 Image");
    });

    it("returns an image placeholder when content decodes to only whitespace", () => {
      expect(abstractify("&nbsp;&nbsp;")).toBe("🖼 Image");
    });
  });

  describe("tag stripping", () => {
    it("strips tags and keeps the text", () => {
      expect(abstractify("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
    });

    it("strips script tags but keeps their text content (rendered as plain text)", () => {
      expect(abstractify("<script>alert(1)</script>")).toBe("alert(1)");
    });

    it("handles malformed/unclosed tags", () => {
      expect(abstractify("<p>hello")).toBe("hello");
    });

    it("turns <br> variants into spaces", () => {
      expect(abstractify("a<br>b<br/>c<br />d")).toBe("a b c d");
    });
  });

  describe("entity decoding", () => {
    it("decodes known named entities", () => {
      expect(abstractify("Tom &amp; Jerry &lt;3 &quot;hi&quot;")).toBe('Tom & Jerry <3 "hi"');
    });

    it("decodes numeric and hex entities in the map", () => {
      expect(abstractify("it&#39;s a &#x2F; slash")).toBe("it's a / slash");
    });

    it("leaves unknown entities untouched", () => {
      expect(abstractify("a &unknownentity; b")).toBe("a &unknownentity; b");
    });

    it("leaves entity-like text without a semicolon untouched", () => {
      expect(abstractify("Fish &amp Chips")).toBe("Fish &amp Chips");
    });
  });

  describe("truncation boundary", () => {
    it("does not truncate text of exactly 100 characters", () => {
      const text = "a".repeat(100);
      expect(abstractify(text)).toBe(text);
    });

    it("truncates text longer than 100 characters to 100 chars + ellipsis", () => {
      const result = abstractify("a".repeat(101));
      expect(result).toHaveLength(103);
      expect(result.endsWith("...")).toBe(true);
    });
  });

  it("preserves unicode and emoji content", () => {
    expect(abstractify("<p>café 🚀 日本語</p>")).toBe("café 🚀 日本語");
  });
});
