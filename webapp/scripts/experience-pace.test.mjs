// 體驗節奏: one pace for every scenario (lib/experiencePace.js). 快速 is 1.5x,
// and every story beat - a message, a typing indicator, a pause, an automatic
// step - goes through it, so a new timer in a scenario cannot quietly stay at
// normal speed.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const pace = await import('../src/lib/experiencePace.js');

test.beforeEach(() => {
  store.clear();
  pace.resetPaceCacheForTests();
});

test('快速 is 1.5x: every beat takes two thirds of its time', () => {
  assert.equal(Math.round((1 / pace.FAST_PACE_MULTIPLIER) * 100) / 100, 1.5);
  pace.setPace('fast');
  assert.equal(pace.paced(1500), 1000);
  assert.equal(pace.paced(900), 600);
});

test('正常 leaves every beat as it was', () => {
  assert.equal(pace.getPace(), 'normal');
  assert.equal(pace.paced(1500), 1500);
});

test('a device set to 快速 for 假檢警 alone stays fast', () => {
  store.set('cibar-scenario03-pace', 'fast');
  assert.equal(pace.getPace(), 'fast');
});

test('the shared setting wins over the old 假檢警-only one', () => {
  store.set('cibar-scenario03-pace', 'fast');
  store.set('cibar-experience-pace', 'normal');
  assert.equal(pace.getPace(), 'normal');
});

// ---------------------------------------------------------------- every timer is paced

const SRC = new URL('../src/', import.meta.url).pathname;
const SCOPES = [
  'pages/scenario01', 'pages/scenario02', 'pages/scenario03', 'pages/scenario04', 'pages/scenario05',
  'apps', 'features', 'lib/dialogueTree.js', 'lib/typedMessages.js', 'lib/autoAdvance.js',
];

// Timers that are not story beats, so they keep their own time. Each is
// `file: a piece of the call` - add one only with the reason beside it.
const NOT_STORY_BEATS = [
  // A video that never starts or stalls: an error path, not the story's pace.
  ['pages/scenario01/VideoTeacher.jsx', 'STALLED_PLAYBACK_TIMEOUT_MS'],
  ['pages/scenario02/PrivateChat.jsx', 'loadTimeoutRef.current = setTimeout'],
  ['pages/scenario02/PrivateChat.jsx', 'stallTimeoutRef.current = setTimeout'],
  ['pages/scenario02/PrivateChat.jsx', 'VIDEO_STATE.PLAYING) return'],
  ['pages/scenario02/PrivateChat.jsx', 'VIDEO_STATE.STALLED'],
  // Animations: a swiped card leaving (380 ms), a tapped product's highlight (220 ms).
  ['apps/meetu/components/ProfileCard.jsx', 'EXIT_MS'],
  ['apps/mydondon/screens/ProductSelect.jsx', 'SELECT_FEEDBACK_MS'],
  // The product page's gallery and description scroll at a reading speed.
  ['apps/blackpi/screens/ProductDetail.jsx', ''],
  // 假檢警 scales its own beats with usePaceMultiplier() (the recording too).
  ['pages/scenario03/', ''],
];

function files(path) {
  const full = join(SRC, path);
  if (statSync(full).isFile()) return [full];
  return readdirSync(full).flatMap((name) => files(join(path, name)));
}

const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function timerCalls(code) {
  const calls = [];
  const re = /setTimeout\(/g;
  let m;
  while ((m = re.exec(code))) {
    let depth = 1;
    let i = re.lastIndex;
    for (; i < code.length && depth > 0; i++) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') depth--;
    }
    const inner = code.slice(re.lastIndex, i - 1);
    // The delay is what follows the last top-level comma.
    let level = 0;
    let comma = -1;
    for (let k = 0; k < inner.length; k++) {
      const c = inner[k];
      if ('([{'.includes(c)) level++;
      else if (')]}'.includes(c)) level--;
      else if (c === ',' && level === 0) comma = k;
    }
    const delay = comma >= 0 ? inner.slice(comma + 1).trim() : '';
    calls.push({ text: code.slice(m.index, i), delay });
  }
  return calls;
}

test('every story timer in every scenario goes through the pace', () => {
  const unpaced = [];
  for (const scope of SCOPES) {
    for (const file of files(scope).filter((f) => /\.(js|jsx)$/.test(f))) {
      const rel = relative(SRC, file);
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const call of timerCalls(code)) {
        if (/paced\(/.test(call.delay)) continue;
        // A click's feedback or a screen change: under 0.5 s, not a beat.
        if (/^\d+$/.test(call.delay) && Number(call.delay) < 500) continue;
        if (NOT_STORY_BEATS.some(([path, piece]) => rel.startsWith(path) && call.text.includes(piece))) continue;
        unpaced.push(`${rel}: ${call.text.replace(/\s+/g, ' ').slice(0, 100)}`);
      }
    }
  }
  assert.deepEqual(unpaced, [], 'story timers not going through paced()');
});
