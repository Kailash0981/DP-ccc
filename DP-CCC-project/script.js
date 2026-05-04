/* ============================================================
   script.js — Longest Increasing Path in a Matrix Simulation
   ============================================================

   Table of Contents
   -----------------
   1. Preset Matrices
   2. State
   3. Helpers
   4. Core Algorithm — Build Steps
   5. Render Grid
   6. Apply Step (drives all UI updates)
   7. Side Panel Updaters
   8. Playback Controls (run / step / reset / stop)
   9. Load Matrix
   10. Event Listeners
   11. Init
   ============================================================ */


/* ── 1. Preset Matrices ────────────────────────────────────── */
const PRESETS = [
  [[9, 9, 4], [6, 6, 8], [2, 1, 1]],           // Example 1 → 4
  [[3, 4, 5], [3, 2, 6], [2, 2, 1]],           // Example 2 → 4
  [[1]],                                         // Example 3 → 1
  [[1, 2, 6, 15], [5, 3, 7, 16],               // Staircase 4×4
   [4, 8, 10, 17], [9, 11, 12, 18]],
  [[17, 8, 1, 3, 10], [6, 14, 11, 15, 2],      // Random 5×5
   [7, 4, 16, 9, 12], [18, 5, 13, 19, 20],
   [21, 22, 23, 24, 25]]
];

/* 4-directional movement (up, down, left, right) */
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];


/* ── 2. State ──────────────────────────────────────────────── */
let matrix  = [];    // current m×n grid
let steps   = [];    // all recorded DFS events
let stepIdx = 0;     // pointer into steps[]
let running = false; // true while auto-play is active
let timerId = null;  // setInterval handle


/* ── 3. Helpers ────────────────────────────────────────────── */

/** Stable string key for a cell position */
const cellKey = (r, c) => `${r},${c}`;

/** Return the DOM element for a cell */
const cellEl = (r, c) => document.getElementById(`cell-${r}-${c}`);

/** Return the memo-value badge element inside a cell */
const memoEl = (r, c) => document.getElementById(`mv-${r}-${c}`);

/** Remove all state class names from every cell */
function clearHighlights() {
  document.querySelectorAll('.cell').forEach(el => (el.className = 'cell'));
}

/** Set the state class on a single cell (clears previous state first) */
function setCellClass(r, c, cls) {
  const el = cellEl(r, c);
  if (el) el.className = `cell ${cls}`;
}

/** Write a value into the memo badge of a cell */
function setCellMemo(r, c, val) {
  const el = memoEl(r, c);
  if (el) el.textContent = val;
}

/** Update the log panel with an HTML string */
function setLog(html) {
  document.getElementById('log-panel').innerHTML = html;
}


/* ── 4. Core Algorithm — Build Steps ──────────────────────── */

/**
 * Runs DFS + memoization over `mat` and records every meaningful
 * event into an array. The visualiser replays these events later.
 *
 * Event types:
 *   visit        — entering a new cell for the first time
 *   try-neighbor — about to recurse into a valid neighbor
 *   back         — returned from a neighbor, updating best
 *   memoize      — finished cell, caching result
 *   memo-hit     — cell already cached, returning early
 *   final        — all cells done; includes best path info
 *
 * @param {number[][]} mat
 * @returns {{ steps: object[], globalBest: number, path: number[][] }}
 */
function buildSteps(mat) {
  const M = mat.length;
  const N = mat[0].length;
  const dp = {};          // memoization cache  { "r,c": length }
  const callStack = [];   // current DFS call stack (for the UI panel)
  const recorded = [];    // the steps array we will return

  function dfs(r, c) {
    const key = cellKey(r, c);

    // Cache hit — no need to recurse
    if (dp[key] !== undefined) {
      recorded.push({ type: 'memo-hit', r, c, val: dp[key], stack: [...callStack] });
      return dp[key];
    }

    // Push frame onto stack and record visit
    callStack.push(key);
    recorded.push({ type: 'visit', r, c, stack: [...callStack] });

    let best = 1; // minimum path length is the cell itself

    // Explore all 4 neighbors
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;

      // Skip out-of-bounds
      if (nr < 0 || nr >= M || nc < 0 || nc >= N) continue;

      // Only recurse into strictly larger values
      if (mat[nr][nc] > mat[r][c]) {
        recorded.push({ type: 'try-neighbor', r, c, nr, nc, stack: [...callStack] });
        const sub = dfs(nr, nc);
        best = Math.max(best, 1 + sub);
        recorded.push({ type: 'back', r, c, nr, nc, best, stack: [...callStack] });
      }
    }

    // Cache and pop the frame
    dp[key] = best;
    callStack.pop();
    recorded.push({ type: 'memoize', r, c, val: best, stack: [...callStack] });

    return best;
  }

  // Run DFS from every unvisited cell
  for (let r = 0; r < M; r++) {
    for (let c = 0; c < N; c++) {
      if (dp[cellKey(r, c)] === undefined) dfs(r, c);
    }
  }

  // Find the cell with the global maximum path length
  let globalBest = 0;
  let bestCell   = [0, 0];

  for (let r = 0; r < M; r++) {
    for (let c = 0; c < N; c++) {
      const v = dp[cellKey(r, c)] || 1;
      if (v > globalBest) { globalBest = v; bestCell = [r, c]; }
    }
  }

  // Trace the actual path (greedy: always move to the neighbor
  // whose dp value is exactly one less than the current cell)
  const path = [];
  let [cr, cc] = bestCell;

  while (true) {
    path.push([cr, cc]);
    let moved = false;

    for (const [dr, dc] of DIRS) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= M || nc < 0 || nc >= N) continue;

      const curLen  = dp[cellKey(cr, cc)] || 1;
      const nextLen = dp[cellKey(nr, nc)] || 1;

      if (mat[nr][nc] > mat[cr][cc] && nextLen === curLen - 1) {
        cr = nr; cc = nc; moved = true; break;
      }
    }

    if (!moved) break;
  }

  // Record the final summary event
  recorded.push({
    type: 'final',
    globalBest,
    bestCell,
    path,
    memo: { ...dp }
  });

  return { steps: recorded, globalBest, bestCell, path };
}


/* ── 5. Render Grid ────────────────────────────────────────── */

/**
 * Builds the cell DOM elements from the current `matrix`.
 * Each cell contains:
 *   .coord    — small (r,c) label at top-left
 *   .val      — the matrix value (large, centred)
 *   .memo-val — dp result badge at bottom-right (filled later)
 */
function renderGrid() {
  const M = matrix.length;
  const N = matrix[0].length;

  const grid = document.getElementById('matrix-grid');
  grid.style.gridTemplateColumns = `repeat(${N}, 62px)`;
  grid.innerHTML = '';

  for (let r = 0; r < M; r++) {
    for (let c = 0; c < N; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${r}-${c}`;
      cell.innerHTML = `
        <span class="coord">${r},${c}</span>
        <span class="val">${matrix[r][c]}</span>
        <span class="memo-val" id="mv-${r}-${c}"></span>
      `;
      grid.appendChild(cell);
    }
  }
}


/* ── 6. Apply Step ─────────────────────────────────────────── */

/**
 * Applies the visual state for steps[idx].
 * Rebuilds the partial memo from all memoize events up to this
 * point so that previously resolved cells stay gray.
 *
 * @param {number} idx  Index into the global `steps` array
 */
function applyStep(idx) {
  if (idx >= steps.length) return;

  const s = steps[idx];

  // ── Rebuild partial memo up to this step ──────────────────
  clearHighlights();
  const partialMemo = {};

  for (let i = 0; i <= idx; i++) {
    const st = steps[i];
    if (st.type === 'memoize') partialMemo[cellKey(st.r, st.c)] = st.val;
    if (st.type === 'final')   Object.assign(partialMemo, st.memo);
  }

  // Apply memo-done class and badge values
  Object.entries(partialMemo).forEach(([key, val]) => {
    const [r, c] = key.split(',').map(Number);
    setCellClass(r, c, 'memo-done');
    setCellMemo(r, c, val);
  });

  // ── Update side panels ────────────────────────────────────
  updateMemoTable(partialMemo);
  updateCallStack(s.stack || []);

  // ── Update progress bar ───────────────────────────────────
  const pct = Math.round((idx / steps.length) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';

  // ── Per-event UI updates ──────────────────────────────────
  switch (s.type) {

    case 'visit':
      setCellClass(s.r, s.c, 'current');
      setLog(`Visiting <span class="hi">(${s.r},${s.c})</span> = <span class="em">${matrix[s.r][s.c]}</span> — searching all 4 neighbors for strictly larger values.`);
      break;

    case 'try-neighbor':
      setCellClass(s.r,  s.c,  'current');
      setCellClass(s.nr, s.nc, 'neighbor');
      setLog(`From <span class="hi">(${s.r},${s.c})=${matrix[s.r][s.c]}</span> → neighbor <span class="amb">(${s.nr},${s.nc})=${matrix[s.nr][s.nc]}</span> qualifies (<span class="amb">${matrix[s.nr][s.nc]}</span> &gt; <span class="hi">${matrix[s.r][s.c]}</span>). Recursing…`);
      break;

    case 'back':
      setCellClass(s.r, s.c, 'current');
      setLog(`Back at <span class="hi">(${s.r},${s.c})=${matrix[s.r][s.c]}</span> — best path from here so far = <span class="ok">${s.best}</span>`);
      break;

    case 'memoize': {
      setCellClass(s.r, s.c, 'memo-done');
      // Trigger pop animation
      const el = cellEl(s.r, s.c);
      if (el) {
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 280);
      }
      setLog(`Cached <span class="hi">(${s.r},${s.c})=${matrix[s.r][s.c]}</span> — longest path from this cell = <span class="ok">${s.val}</span>`);
      break;
    }

    case 'memo-hit':
      setCellClass(s.r, s.c, 'current');
      setLog(`<span class="ok">Cache hit</span> at <span class="hi">(${s.r},${s.c})=${matrix[s.r][s.c]}</span> — already computed: <span class="ok">${s.val}</span>. Skipping re-computation.`);
      break;

    case 'final': {
      // Highlight the full path, with the starting cell in gold
      s.path.forEach(([r, c]) => setCellClass(r, c, 'path'));
      setCellClass(s.bestCell[0], s.bestCell[1], 'path-final');

      const pathVals = s.path.map(([r, c]) => matrix[r][c]).join(' → ');

      // Show result bar
      const bar = document.getElementById('result-bar');
      bar.style.display = 'flex';
      document.getElementById('res-len').textContent  = s.globalBest;
      document.getElementById('res-path').textContent = pathVals;

      setLog(`<span class="ok">Done!</span> Longest increasing path = <span class="ok">${s.globalBest}</span>. Values: <span class="hi">${pathVals}</span>`);
      document.getElementById('progress-fill').style.width = '100%';
      break;
    }
  }
}


/* ── 7. Side Panel Updaters ────────────────────────────────── */

/**
 * Rebuild the memo cache table from a partial snapshot.
 * Iterates cells in row-major order so the table is stable.
 *
 * @param {Object} pm  { "r,c": value }
 */
function updateMemoTable(pm) {
  const M = matrix.length;
  const N = matrix[0].length;
  let html = '';

  for (let r = 0; r < M; r++) {
    for (let c = 0; c < N; c++) {
      const key = cellKey(r, c);
      if (pm[key] !== undefined) {
        html += `<tr>
          <td>(${r},${c}) val=${matrix[r][c]}</td>
          <td class="val">${pm[key]}</td>
        </tr>`;
      }
    }
  }

  document.getElementById('memo-tbody').innerHTML =
    html || '<tr><td colspan="2" class="empty-msg">Empty</td></tr>';
}

/**
 * Rebuild the call-stack list from the current snapshot.
 * The top of the stack (most-recent frame) is shown first.
 *
 * @param {string[]} stack  Array of "r,c" keys, bottom-to-top
 */
function updateCallStack(stack) {
  const ul = document.getElementById('call-stack');

  if (!stack.length) {
    ul.innerHTML = '<li class="empty-msg">—</li>';
    return;
  }

  // Reverse so the active frame is at the top of the list
  ul.innerHTML = [...stack].reverse().map((key, i) => {
    const [r, c] = key.split(',').map(Number);
    return `<li class="${i === 0 ? 'active' : ''}">${key} = ${matrix[r][c]}</li>`;
  }).join('');
}


/* ── 8. Playback Controls ──────────────────────────────────── */

/** Stop auto-play without resetting the step index */
function stopRun() {
  running = false;
  clearInterval(timerId);
  timerId = null;
  document.getElementById('run-btn').textContent = '▶ Run DFS';
  document.getElementById('step-btn').disabled   = false;
}

/** Reset the simulation to its initial (pre-run) state */
function reset() {
  stopRun();
  stepIdx = 0;

  clearHighlights();
  document.querySelectorAll('.memo-val').forEach(el => (el.textContent = ''));

  document.getElementById('memo-tbody').innerHTML =
    '<tr><td colspan="2" class="empty-msg">Empty — run to fill</td></tr>';

  document.getElementById('call-stack').innerHTML =
    '<li class="empty-msg">—</li>';

  document.getElementById('log-panel').innerHTML =
    'Press <strong>▶ Run DFS</strong> to animate the full traversal, ' +
    'or <strong>Step →</strong> to advance one event at a time.';

  document.getElementById('result-bar').style.display = 'none';
  document.getElementById('progress-fill').style.width = '0%';
}

/** Start (or restart) the auto-play interval */
function startAutoPlay() {
  const delay = Number(document.getElementById('speed-slider').value);

  timerId = setInterval(() => {
    if (stepIdx < steps.length) {
      applyStep(stepIdx++);
    } else {
      stopRun();
    }
  }, delay);
}


/* ── 9. Load Matrix ────────────────────────────────────────── */

/**
 * Replace the current matrix, rebuild the step list, reset all
 * UI state, and render the new grid.
 *
 * @param {number[][]} mat
 */
function loadMatrix(mat) {
  matrix = mat.map(row => [...row]);
  const result = buildSteps(matrix);
  steps = result.steps;

  reset();
  renderGrid();
}


/* ── 10. Event Listeners ───────────────────────────────────── */

// Preset dropdown
document.getElementById('preset-sel').addEventListener('change', function () {
  loadMatrix(PRESETS[Number(this.value)] || PRESETS[0]);
});

// Custom matrix loader
document.getElementById('load-btn').addEventListener('click', () => {
  try {
    const raw = document.getElementById('custom-input').value.trim();
    const mat = JSON.parse(raw);

    // Basic validation
    if (!Array.isArray(mat) || !Array.isArray(mat[0])) throw new Error('Not a 2-D array');

    loadMatrix(mat);
  } catch (_) {
    document.getElementById('log-panel').innerHTML =
      '<span class="err">Invalid format. Use e.g. <strong>[[1,2],[3,4]]</strong></span>';
  }
});

// Run / Pause toggle
document.getElementById('run-btn').addEventListener('click', function () {
  if (running) {
    stopRun();
    return;
  }

  // If we've reached the end, restart from scratch
  if (stepIdx >= steps.length) reset();

  running = true;
  this.textContent = '⏸ Pause';
  document.getElementById('step-btn').disabled = true;

  startAutoPlay();
});

// Manual step button
document.getElementById('step-btn').addEventListener('click', () => {
  if (stepIdx < steps.length) applyStep(stepIdx++);
});

// Reset button
document.getElementById('reset-btn').addEventListener('click', reset);

// Speed slider — update label and restart interval if running
document.getElementById('speed-slider').addEventListener('input', function () {
  document.getElementById('speed-lbl').textContent = this.value + 'ms';

  if (running) {
    clearInterval(timerId);
    startAutoPlay(); // restart with the new delay
  }
});


/* ── 11. Init ──────────────────────────────────────────────── */
loadMatrix(PRESETS[0]);
