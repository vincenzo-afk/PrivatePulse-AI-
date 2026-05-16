const PATTERNS: Record<string, RegExp> = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  phone: /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  accountNumber: /\b(account|acct)[\s#:]*\d{6,16}\b/gi,
  routingNumber: /\brouting[\s#:]*\d{9}\b/gi,
  dob: /\b(DOB|Date of Birth|Born)[\s:]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/gi,
};

const MASK_CHAR = "█";

export function maskSensitiveText(text: string): string {
  if (!text) return text;
  let masked = text;
  for (const pattern of Object.values(PATTERNS)) {
    masked = masked.replace(pattern, (match) => MASK_CHAR.repeat(match.length));
  }
  return masked;
}

export function getMaskedEntityRanges(text: string): { start: number; end: number; type: string }[] {
  const ranges: { start: number; end: number; type: string }[] = [];
  for (const [type, pattern] of Object.entries(PATTERNS)) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length, type });
    }
  }
  return ranges.sort((a, b) => a.start - b.start);
}
