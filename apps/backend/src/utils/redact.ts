export function redactPII(text: string): string {
  if (!text) return text

  let redacted = text

  // 1. Email Redaction (handles +, modern TLDs)
  const emailRegex = /([a-zA-Z0-9_\-\.\+]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,10})/gi
  redacted = redacted.replace(emailRegex, "[EMAIL REDACTED]")

  // 2. Phone Number Redaction
  // US format (e.g. 555-123-4567, (555) 123 4567, etc.)
  const usPhoneRegex = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?:\s*(?:ext|x|ext\.)\s*\d+)?/gi
  // International format (strict start with + to avoid matching dates like 2020-2024 or IDs)
  const intlPhoneRegex = /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?(?:[\s.-]?\d{1,4}){2,4}(?:\s*(?:ext|x|ext\.)\s*\d+)?/gi

  redacted = redacted.replace(usPhoneRegex, "[PHONE REDACTED]")
  redacted = redacted.replace(intlPhoneRegex, "[PHONE REDACTED]")

  return redacted
}
