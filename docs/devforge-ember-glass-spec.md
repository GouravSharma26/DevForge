# DevForge — Ember Glass Design System

Replaces the current purple/violet dark-dashboard palette across the app. Direction: glassmorphism (frosted, translucent panels) on a warm near-black base, with an ember/copper accent grounded in the product name (Forge → molten metal, heat).

Reference mockup: `devforge-ui-directions.html` (Option B, revised palette section) — open this and compare against it directly during implementation, don't work from hex values alone.

---

## Color tokens (replace existing purple tokens 1:1)

| Old (purple) | New (ember) | Usage |
|---|---|---|
| `#0d0d1a` (base bg) | `#171210` | Page background — warm near-black, not blue-black |
| `#12122b` (surface) | `#1c1712` | Secondary surface (navbar, panels) |
| `#16163a` (card) | `rgba(255,237,213,0.05)` on `#171210` | Card background — now translucent, see Glass Treatment below |
| `#7c3aed` (accent) | `#ea580c` | Primary accent — buttons, active states, links |
| `#a855f7` (light accent) | `#f59e0b` | Highlight accent — high scores, hover states, gradient end |
| `#1f1f45` (border) | `rgba(255,180,120,0.14)` | Card/panel borders |
| `#a09dc0` (secondary text) | `#d4a373` | Secondary/muted text on dark surfaces |
| `#f1f0ff` (primary text) | `#fdf6f0` | Primary text — warm off-white, not cool white |
| `#5a5780` (muted text) | `#8a7a6a` | Muted/tertiary text, timestamps |
| `#10b981` (success — keep) | `#10b981` | Unchanged — success stays green for universal meaning |
| `#ef4444` (error — keep) | `#ef4444` | Unchanged — error stays red for universal meaning |
| `#f59e0b` (warning — was amber) | `#eab308` | Slightly shifted so it doesn't collide with the new highlight accent |

**Do not touch:** success/error semantic colors. Changing what red/green mean would hurt usability for no visual gain.

## Glass treatment — exact values

Apply to: resume cards, JD match history cards, interview hub cards, modals, score badges, buttons with the glass treatment.

```css
background: rgba(255,237,213,0.05);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255,180,120,0.14);
border-radius: 16px;
```

Score badges / small circular elements use a lighter blur:
```css
background: rgba(255,180,120,0.08);
backdrop-filter: blur(6px);
border: 1px solid rgba(255,180,120,0.18);
```

Buttons (glass variant):
```css
background: rgba(217,119,6,0.18);
backdrop-filter: blur(8px);
border: 1px solid rgba(253,186,116,0.45);
color: #fed7aa;
```

Progress bars / score fills:
```css
background: linear-gradient(90deg, #ea580c, #f59e0b);
border-radius: 99px;
```

Ambient background glow (page-level, behind card grids — subtle, not on every element):
```css
background: radial-gradient(circle at 30% 20%, #c2591b33, transparent 60%),
            radial-gradient(circle at 80% 80%, #7c2d1233, transparent 60%),
            #171210;
```

## Typography

No change — JetBrains Mono stays throughout. This palette change is color/surface only.

## What NOT to change in this pass

- Layout, spacing, component structure — this is a palette + surface-treatment pass, not a redesign of information architecture.
- Score color logic (green ≥80, amber 60-79, red <60) — keep the semantic thresholds, just verify the amber shifts correctly against the new `#eab308`.
- Any success/error states.

---

## Rollout plan — prototype first, don't touch everything at once

1. **Apply to the Resume Hub (`/resume`) only, first.** This has the highest density of the card pattern (grid of resume cards) and will show whether the glass treatment holds up across many repeated cards, not just one hero example.
2. Get it reviewed in the actual running app before touching anything else — a mockup and a real page with real data/scroll/hover states can look different.
3. Once approved: roll out to Resume Detail (`/resume/[id]`), Interview Hub (`/interview`), JD Match modal/cards, and the global navbar/page background, in that order.
4. Leave `/problems` and `/arena` (DSA/Monaco editor pages) for a separate pass — they have different UI needs (code editor contrast, syntax highlighting) that deserve their own look at how the new palette interacts with Monaco's theme, rather than assuming it transfers cleanly.

## Verification

Before calling any page "done": screenshot it in the actual browser, side by side with `devforge-ui-directions.html`'s Option B section, and confirm the translucency/blur is actually rendering (not silently falling back to solid, which `backdrop-filter` can do in some browser/GPU configurations) — check in the real app, not just that the CSS was written correctly.
