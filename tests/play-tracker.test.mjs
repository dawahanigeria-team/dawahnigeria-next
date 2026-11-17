import assert from "node:assert/strict";
import { test } from "node:test";
import { createPlayTracker } from "../src/features/player/playEvents.ts";

function setup() {
  const reports = [];
  const tracker = createPlayTracker((id) => reports.push(id));
  const play = (lectureId, fromMs, toMs, stepMs = 1_000) => {
    for (let t = fromMs; t <= toMs; t += stepMs) {
      tracker.tick({ lectureId, isPlaying: true, nowMs: t });
    }
  };
  const pause = (lectureId, nowMs) =>
    tracker.tick({ lectureId, isPlaying: false, nowMs });
  return { tracker, reports, play, pause };
}

test("30 seconds of continuous playback reports exactly once", () => {
  const { reports, play } = setup();
  play("42", 0, 29_000);
  assert.deepEqual(reports, []);
  play("42", 30_000, 120_000);
  assert.deepEqual(reports, ["42"]);
});

test("heard time comes from the clock, so a seek does not count as listening", () => {
  const { reports, play, tracker } = setup();
  play("42", 0, 10_000);
  // A seek ten minutes ahead moves the position, not the clock.
  tracker.tick({ lectureId: "42", isPlaying: true, nowMs: 10_250 });
  play("42", 11_000, 29_000);
  assert.deepEqual(reports, []);
  play("42", 30_250, 30_250);
  assert.deepEqual(reports, ["42"]);
});

test("a gap longer than 5 seconds between ticks is not counted", () => {
  const { reports, play } = setup();
  play("42", 0, 20_000);
  play("42", 80_000, 89_000);
  assert.deepEqual(reports, []);
  play("42", 90_000, 90_000);
  assert.deepEqual(reports, ["42"]);
});

test("changing track starts a new listen", () => {
  const { reports, play } = setup();
  play("42", 0, 20_000);
  play("43", 21_000, 50_000);
  assert.deepEqual(reports, []);
  play("43", 51_000, 51_000);
  assert.deepEqual(reports, ["43"]);
});

test("paused time is not counted and listening accumulates across a resume", () => {
  const { reports, play, pause } = setup();
  play("42", 0, 15_000);
  pause("42", 15_500);
  play("42", 600_000, 614_000);
  assert.deepEqual(reports, []);
  play("42", 615_000, 615_000);
  assert.deepEqual(reports, ["42"]);
});

test("a finished listen can be reported again on restart", () => {
  const { reports, play, tracker } = setup();
  play("42", 0, 40_000);
  tracker.startNewListen();
  play("42", 41_000, 70_000);
  assert.deepEqual(reports, ["42"]);
  play("42", 71_000, 71_000);
  assert.deepEqual(reports, ["42", "42"]);
});

test("ids that are not numeric lecture ids are never reported", () => {
  const { reports, play } = setup();
  play("local-file", 0, 60_000);
  play("42", 61_000, 92_000);
  assert.deepEqual(reports, ["42"]);
});
