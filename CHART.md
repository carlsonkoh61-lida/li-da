# Li-Da — The Chart

How the Desk chart translates The Read into something a non-expert can instantly relate to. Living doc.

## North star

The chart must tell a story a non-expert can read without being a data-analysis expert.
- **Heart (A):** the chart visually translates The Read's claims — every claim has a place you can see it.
- **Supplementary (B):** the user's own journey (past logged calls + how they played out). **(C):** risk/reward made visible.
- **Guardrail:** annotate what's TRUE (evidence behind the read), never PREDICT. Plain-language but never simplistic-to-the-point-of-misleading. Calm, not hype.
- **Design principle:** calm by default, depth on demand — simple view first, complexity the user opts into.

## Shipped (verified live 24 Jun)

- ✅ **Risk/reward bands** — entry→stop shaded as risk, entry→target as reward (uses the user's own logged levels; calm low-opacity fills).
- ✅ **Price-label declutter** — level labels reduced to words (entry/stop/target), per-column collision stacking, entry label suppressed when ≈ live price, band labels only when the band is tall enough, gridline number suppressed when it collides with the live-price label. Chart now reads calm even when levels cluster tightly.

## Queued chapters (next sessions — design as a SET, they share rendering + axis real-estate)

- **Axis number-chips** — put the exact entry/stop/target price in a highlighted colored box on the right price axis (TradingView pattern — ref the user's NVDA screenshot), keeping the word label on the left and the dashed line across. Solves "calm vs. informative": word = which line, axis chip = what price. Must handle chip-to-chip and chip-to-gridline collisions on the axis.
- **Layer toggles** — let the user turn MA20 / MA50 / RSI / volume on and off. Default to a calm minimal view; depth on demand. (Biggest build: UI + state + conditional rendering.)
- **Chart-type toggle** — candlestick / line / bar (pick one, NOT an "all" overlay). Line is the most beginner-readable default. (New draw modes.)
- **Hover-definitions** — plain-English definitions for chart jargon (RSI, MA20, MA50) on hover, reusing the `glossTerm` / glossary pattern already used for the read's terms.
- **THE BIG ONE — read emits structured levels** — currently `read.levels` (and `stress_test.kill_switch`) are PROSE; the chart can't draw the support/resistance Li-Da actually names. Requires `analyze.js` to emit structured numbers, e.g. `levels: { support: [...], resistance: [...] }` and `kill_switch_price`. This is the truest "translate the read onto the chart" and the highest-value investment. Needs prompt work + testing that the AI returns clean numbers. Its own careful chapter — NOT a quick brick.

## Build order (recommendation)

Axis-chips (cheap, high-clarity, user already found the pattern) → hover-defs (reuses glossary) → chart-type + layer toggles (design together — shared controls) → structured levels (the big engine investment, its own session).
