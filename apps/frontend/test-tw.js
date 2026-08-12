import { compile } from "tailwindcss";

const css = `
@import "tailwindcss";
@config "./tailwind.config.mjs";

.test {
  @apply bg-base/50 text-primary/30 border-border/10;
}
`;

async function main() {
  // We can't import compile from tailwindcss easily in a commonjs script if it's ESM, but let's try.
  // Actually, let's just write a file and run Tailwind CLI... wait CLI is not working.
}
