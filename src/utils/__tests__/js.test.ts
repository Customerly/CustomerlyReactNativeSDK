import { buildJsCall } from "../js";

describe("buildJsCall", () => {
  describe("basics", () => {
    it("builds a call with no arguments", () => {
      expect(buildJsCall("customerly.open")).toBe("customerly.open()");
    });

    it("serializes a simple string argument", () => {
      expect(buildJsCall("customerly.event", "checkout")).toBe('customerly.event("checkout")');
    });

    it("serializes multiple arguments of mixed types", () => {
      expect(buildJsCall("_customerly_sdk.navigate", "/", true)).toBe('_customerly_sdk.navigate("/", true)');
      expect(buildJsCall("customerly.attribute", "plan", 42)).toBe('customerly.attribute("plan", 42)');
    });
  });

  describe("string escaping (injection safety)", () => {
    it("escapes single quotes (regression: apostrophes)", () => {
      expect(buildJsCall("customerly.showNewMessage", "I'm stuck")).toBe('customerly.showNewMessage("I\'m stuck")');
    });

    it("escapes double quotes and backslashes", () => {
      expect(buildJsCall("customerly.event", 'a"b\\c')).toBe('customerly.event("a\\"b\\\\c")');
    });

    it("escapes newlines, carriage returns and tabs", () => {
      expect(buildJsCall("customerly.event", "a\nb\r\nc\td")).toBe('customerly.event("a\\nb\\r\\nc\\td")');
    });

    it("escapes control characters", () => {
      const input = String.fromCharCode(0, 7, 31); // NUL, BEL, US
      expect(buildJsCall("customerly.event", input)).toBe('customerly.event("\\u0000\\u0007\\u001f")');
    });

    it("neutralizes a call-breakout injection attempt", () => {
      const malicious = "');window.__pwned=true;//";
      expect(buildJsCall("customerly.event", malicious)).toBe('customerly.event("\');window.__pwned=true;//")');
    });

    it("keeps closing-tag-like content as an inert string (JS context, not HTML)", () => {
      // buildJsCall output is injected via injectJavaScript (JS context), so
      // </script> is just string data here — no HTML escaping required.
      expect(buildJsCall("customerly.event", "</script>")).toBe('customerly.event("</script>")');
    });

    it("preserves unicode and emoji", () => {
      expect(buildJsCall("customerly.event", "café 🚀 日本語")).toBe('customerly.event("café 🚀 日本語")');
    });
  });

  describe("non-string primitives", () => {
    it("serializes null", () => {
      expect(buildJsCall("customerly.attribute", "x", null)).toBe('customerly.attribute("x", null)');
    });

    it("renders undefined as a valid identifier so the call stays syntactically valid", () => {
      expect(buildJsCall("customerly.registerLead", "a@b.com", undefined)).toBe(
        'customerly.registerLead("a@b.com", undefined)',
      );
    });

    it("serializes booleans", () => {
      expect(buildJsCall("f", true, false)).toBe("f(true, false)");
    });

    it("serializes integers, negatives and floats", () => {
      expect(buildJsCall("f", 0, -7, 3.14)).toBe("f(0, -7, 3.14)");
    });

    it("collapses -0 to 0", () => {
      expect(buildJsCall("f", -0)).toBe("f(0)");
    });

    it("renders non-finite numbers as null (JSON.stringify behavior)", () => {
      expect(buildJsCall("f", NaN)).toBe("f(null)");
      expect(buildJsCall("f", Infinity)).toBe("f(null)");
      expect(buildJsCall("f", -Infinity)).toBe("f(null)");
    });

    it("renders functions and symbols as undefined (dropped by JSON.stringify)", () => {
      expect(buildJsCall("f", () => {})).toBe("f(undefined)");
      expect(buildJsCall("f", Symbol("s"))).toBe("f(undefined)");
    });
  });

  describe("objects and arrays", () => {
    it("serializes objects as JSON", () => {
      expect(buildJsCall("customerly.registerLead", "a@b.com", { source: "app" })).toBe(
        'customerly.registerLead("a@b.com", {"source":"app"})',
      );
    });

    it("serializes nested objects and arrays", () => {
      expect(buildJsCall("f", { a: [1, 2], b: { c: true } })).toBe('f({"a":[1,2],"b":{"c":true}})');
    });

    it("serializes empty objects and arrays", () => {
      expect(buildJsCall("f", {}, [])).toBe("f({}, [])");
    });

    it("drops undefined/function values inside objects (JSON.stringify behavior)", () => {
      expect(buildJsCall("f", { a: 1, b: undefined, c: () => {} })).toBe('f({"a":1})');
    });
  });

  describe("worst-case inputs that throw", () => {
    it("throws on a BigInt argument (JSON.stringify cannot serialize it)", () => {
      expect(() => buildJsCall("f", 10n)).toThrow(TypeError);
    });

    it("throws on a circular reference", () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      expect(() => buildJsCall("f", circular)).toThrow(TypeError);
    });
  });
});
