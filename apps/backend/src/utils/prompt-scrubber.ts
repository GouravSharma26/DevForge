export function containsPromptInjection(text: string): boolean {
  const injectionPatterns = [
    /ignore (all )?(previous )?instructions/i,
    /disregard (all )?(previous )?instructions/i,
    /forget (all )?(previous )?instructions/i,
    /you are now/i,
    /bypass( previous)?/i,
    /system prompt/i,
    /forget everything/i,
    /act as (an? )?uncensored/i,
    /system instruction/i,
    /pretend you are/i,
  ];

  return injectionPatterns.some((pattern) => pattern.test(text));
}

export function isGarbageText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 5) return true; // too short
  
  const words = trimmed.split(/\s+/);
  if (words.length > 300) return true; // too long for an interview message
  
  // High concentration of special characters or random typing
  const specialChars = trimmed.match(/[^a-zA-Z0-9\s.,!?'"()-]/g);
  if (specialChars && specialChars.length > trimmed.length * 0.3) {
    return true; // more than 30% special chars
  }

  return false;
}
