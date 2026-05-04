# 329 · Longest Increasing Path in a Matrix — Interactive Simulation

![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat)

An interactive, step-by-step visual simulation of **LeetCode #329 — Longest Increasing Path in a Matrix**, built with pure HTML, CSS, and JavaScript. No frameworks. No build tools. Just open and run.

---

## 📁 Project Structure

```
lip-simulation/
├── index.html       →  Page structure and layout (markup only)
├── style.css        →  All styling, themes, animations, responsive rules
└── script.js        →  Algorithm logic, step recorder, and UI controller
```

---

## 🚀 How to Run

### Option 1 — Direct browser (simplest)
1. Download all three files into the **same folder**
2. Double-click `index.html`
3. It opens in your default browser — done

### Option 2 — VS Code Live Server
1. Open the folder in VS Code
2. Install the **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. Automatically reloads on any file change

### Option 3 — VS Code built-in
1. Open `index.html` in VS Code
2. Press `Ctrl+Shift+P` → type **Simple Browser**
3. Enter the file path or use the Live Preview extension

> **No npm, no build step, no server required.** All three files are plain static files.

---

## 🧩 What the Simulation Does

Given an `m × n` matrix of integers, the simulation visually demonstrates finding the **longest strictly increasing path** — moving only up, down, left, or right (no diagonals, no wrap-around).

### Algorithm Used
**DFS + Memoization (Top-down Dynamic Programming)**

| Property | Value |
|---|---|
| Time Complexity | O(m × n) |
| Space Complexity | O(m × n) |
| Technique | DFS with memo cache |
| Movement | 4-directional only |

---

## 🎮 Controls

| Control | What it does |
|---|---|
| **Preset dropdown** | Load one of 5 built-in example matrices |
| **Custom input** | Type any matrix as JSON e.g. `[[1,2],[3,4]]` then click Load |
| **▶ Run DFS** | Auto-plays every step at the selected speed |
| **⏸ Pause** | Pauses auto-play (same button toggles) |
| **Step →** | Advance exactly one DFS event at a time |
| **Reset** | Clear all highlights and restart from step 0 |
| **Speed slider** | Control animation delay: 60ms (fast) → 1200ms (slow) |

---

## 🎨 Cell Color Guide

| Color | Meaning |
|---|---|
| 🟣 Purple | Cell currently being processed by DFS |
| 🟡 Amber outline | Neighbor cell being evaluated |
| ⬜ Gray fill | Cell fully computed and cached in memo |
| 🟠 Orange fill | Cell is part of the traced longest path |
| 🟡 Gold fill | Starting cell of the final longest path |

---

## 📊 Live Panels

### Memo Cache Panel (right side)
Shows `dp[row][col]` — the longest path length starting from each resolved cell. Fills in live as cells are memoized.

### DFS Call Stack Panel (right side)
Shows the current recursion stack. The topmost entry (highlighted purple) is the active frame. Stack shrinks as functions return.

### Log Panel (below grid)
Describes exactly what is happening at each step in plain English — which cell is being visited, which neighbor qualifies, what value was cached.

### Progress Bar
Tracks how far through the full steps array the simulation has advanced.

---

## 🔧 How the Logic Works (for developers)

### Step 1 — Pre-record (`buildSteps`)
When a matrix loads, `buildSteps()` runs the **complete DFS immediately** and records every event into a flat `steps[]` array. Nothing is animated at this point.

```js
// Each recorded event looks like:
{ type: 'visit',        r, c, stack }
{ type: 'try-neighbor', r, c, nr, nc, stack }
{ type: 'back',         r, c, best, stack }
{ type: 'memoize',      r, c, val, stack }
{ type: 'memo-hit',     r, c, val, stack }
{ type: 'final',        globalBest, path, memo }
```

### Step 2 — Replay with a pointer (`stepIdx`)
The simulation never re-runs the algorithm. It just moves `stepIdx` through `steps[]`.

```
Auto-play:  setInterval → applyStep(stepIdx++) every N ms
Step mode:  button click → applyStep(stepIdx++) once
```

### Step 3 — `applyStep(idx)` updates the UI
1. **Rebuild partial memo** — loops steps[0..idx], collects all `memoize` events → grays out resolved cells
2. **Apply CSS class** — based on event type, sets `.current`, `.neighbor`, `.memo-done`, `.path`, `.path-final`
3. **Update side panels** — memo table + call stack rebuilt from the current snapshot
4. **Update log + progress bar**

### Why pre-record instead of animating live?
JavaScript recursion cannot be paused mid-execution. Pre-recording turns the recursive DFS tree into a flat, seekable event list — making pause, resume, and step-by-step trivial.

---

## 📋 Preset Matrices

| # | Matrix | Expected Output |
|---|---|---|
| Example 1 | `[[9,9,4],[6,6,8],[2,1,1]]` | 4 — path: `1→2→6→9` |
| Example 2 | `[[3,4,5],[3,2,6],[2,2,1]]` | 4 — path: `3→4→5→6` |
| Example 3 | `[[1]]` | 1 |
| Staircase 4×4 | `[[1,2,6,15],[5,3,7,16],...]` | 8 |
| Random 5×5 | `[[17,8,1,3,10],...]` | 9 |

---

## ✏️ Custom Matrix Format

Enter any valid 2D array as JSON in the custom input field:

```
[[1,2,3],[4,5,6],[7,8,9]]
```

Rules:
- Must be a valid JSON 2D array
- All rows must have equal length
- Values can be any integer (0 to 2³¹ − 1 as per LeetCode constraints)
- Matrix size: 1×1 minimum, tested up to 8×8 in the UI

---

## 🗂 File Details

### `index.html`
- Pure semantic markup — no inline styles or scripts
- Links to `style.css` in `<head>` and `script.js` before `</body>`
- Contains all structural sections: header, controls, legend, grid area, side panels, log, result bar, algorithm info cards
- Google Fonts loaded via CDN (`Syne` + `JetBrains Mono`)

### `style.css`
Organized into 15 sections (table of contents at the top):
1. CSS Variables (theme tokens)
2. Reset & Base
3. Layout
4. Header
5. Controls
6. Legend
7. Progress Bar
8. Matrix Grid & Cells
9. Cell State Classes
10. Side Panels
11. Log Panel
12. Result Bar
13. Algorithm Info Cards
14. Animations (`@keyframes pop`)
15. Responsive (mobile breakpoint at 640px)

### `script.js`
Organized into 11 sections (table of contents at the top):
1. Preset Matrices
2. State variables
3. Helper functions
4. `buildSteps()` — core algorithm + event recorder
5. `renderGrid()` — DOM builder
6. `applyStep()` — main UI driver
7. `updateMemoTable()` — side panel
8. `updateCallStack()` — side panel
9. Playback controls (`stopRun`, `reset`, `startAutoPlay`)
10. `loadMatrix()` — orchestrator
11. Event listeners + Init

---

## 🌐 Browser Compatibility

| Browser | Supported |
|---|---|
| Chrome 90+ | ✅ |
| Firefox 88+ | ✅ |
| Safari 14+ | ✅ |
| Edge 90+ | ✅ |

Uses only standard ES6+ features — `const/let`, arrow functions, `Array.from`, template literals, `forEach`, spread operator. No polyfills needed.

---

## 📄 License

Free to use for learning, teaching, and portfolio purposes.

---

*Built to visualize LeetCode #329 — DFS + Memoization on a matrix grid.*
