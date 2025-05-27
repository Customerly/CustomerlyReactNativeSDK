export const safelyParseNumber = (value: unknown): number => {
  try {
    const number = Number(value);
    return isNaN(number) ? 0 : number;
  } catch (error) {
    console.error("[Customerly] Error parsing number:", error);
    return 0;
  }
};
