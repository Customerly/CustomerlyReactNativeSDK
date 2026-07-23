const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * Generates a random alphanumeric string of exactly `length` characters.
 *
 * Note: the previous `Math.random().toString(36).substring(...)` approach could
 * return fewer characters than requested (and even an empty string when
 * `Math.random()` produced a small value), which weakened the uniqueness of the
 * WebView invocation ids and keys. This builds the string character by character
 * so the length is always guaranteed.
 */
export const generateRandomString = (length: number): string => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return result;
};
