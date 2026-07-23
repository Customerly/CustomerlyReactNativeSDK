import { buildJsCall } from "../js";

describe("buildJsCall", () => {
  it("serializes a simple string argument", () => {
    expect(buildJsCall("customerly.event", "checkout")).toBe('customerly.event("checkout")');
  });

  it("escapes single quotes so the call cannot break (regression: apostrophes)", () => {
    expect(buildJsCall("customerly.showNewMessage", "I'm stuck")).toBe('customerly.showNewMessage("I\'m stuck")');
  });

  it("escapes double quotes and backslashes", () => {
    expect(buildJsCall("customerly.event", 'a"b\\c')).toBe('customerly.event("a\\"b\\\\c")');
  });

  it("escapes newlines instead of producing an invalid multiline literal", () => {
    expect(buildJsCall("customerly.event", "line1\nline2")).toBe('customerly.event("line1\\nline2")');
  });

  it("neutralizes a script-injection attempt by keeping it inside a string literal", () => {
    // The malicious payload tries to close a single-quoted call and run code.
    // Because arguments are JSON-encoded (double-quoted, escaped), the payload
    // stays inert data inside the string literal rather than executable JS.
    const malicious = "');window.__pwned=true;//";
    const call = buildJsCall("customerly.event", malicious);
    expect(call).toBe('customerly.event("\');window.__pwned=true;//")');
  });

  it("serializes multiple arguments of mixed types", () => {
    expect(buildJsCall("_customerly_sdk.navigate", "/", true)).toBe('_customerly_sdk.navigate("/", true)');
    expect(buildJsCall("customerly.attribute", "plan", 42)).toBe('customerly.attribute("plan", 42)');
  });

  it("serializes object arguments as JSON", () => {
    expect(buildJsCall("customerly.registerLead", "a@b.com", { source: "app" })).toBe(
      'customerly.registerLead("a@b.com", {"source":"app"})',
    );
  });

  it("keeps a trailing undefined argument syntactically valid", () => {
    expect(buildJsCall("customerly.registerLead", "a@b.com", undefined)).toBe(
      'customerly.registerLead("a@b.com", undefined)',
    );
  });

  it("supports a numeric first argument (showArticle by id)", () => {
    expect(buildJsCall("customerly.showArticle", 123, undefined)).toBe("customerly.showArticle(123, undefined)");
  });
});
