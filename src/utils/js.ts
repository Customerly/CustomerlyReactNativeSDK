const serializeArg = (value: unknown): string => {
  const serialized = JSON.stringify(value);
  // JSON.stringify returns `undefined` (not the string "undefined") for
  // `undefined`, functions and symbols. Coerce so the generated call stays
  // syntactically valid, e.g. `customerly.registerLead("a@b.com", undefined)`.
  return serialized === undefined ? "undefined" : serialized;
};

/**
 * Builds a JS call expression with safely-serialized arguments, e.g.
 * `buildJsCall("customerly.event", "checkout")` -> `customerly.event("checkout")`.
 *
 * Every argument is JSON-encoded so strings containing quotes, backslashes or
 * newlines cannot break out of the call or inject arbitrary JS into the WebView.
 */
export const buildJsCall = (fn: string, ...args: unknown[]): string => `${fn}(${args.map(serializeArg).join(", ")})`;
