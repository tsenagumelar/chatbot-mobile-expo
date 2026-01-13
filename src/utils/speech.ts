export const sanitizeSpeechText = (text: string) =>
  text
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, "")
    .replace(/[\u2600-\u27BF]/g, "")
    .replace(/[\uFE0F\u200D]/g, "")
    .replace(/\s+/g, " ")
    .trim();
