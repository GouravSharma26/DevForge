import { sleep } from "./sleep";

export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; baseDelay?: number } = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelay = options.baseDelay ?? 2000;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      // 429: Too Many Requests (Quota)
      // 503: Service Unavailable
      if (![429, 503].includes(e.status) || i === retries - 1) {
        throw e;
      }
      await sleep(baseDelay * Math.pow(2, i));
    }
  }
  throw new Error("Unreachable");
}
