import test from "node:test";
import assert from "node:assert/strict";

import { formatTime, mapSongsToQueue, toTrack } from "../../assets/js/modules/player.js";

test("formatTime keeps m:ss behavior used by player UI", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(3), "0:03");
  assert.equal(formatTime(65), "1:05");
  assert.equal(formatTime(-10), "0:00");
});

test("toTrack normalizes Subsonic song payload", () => {
  const track = toTrack({
    id: "song-1",
    title: "Dirty Deeds",
    artist: "AC/DC",
    album: "Dirty Deeds Done Dirt Cheap",
    albumId: "album-1",
    duration: "217",
    coverArt: "cover-1",
    starred: 1,
    playCount: "9",
  });

  assert.deepEqual(track, {
    id: "song-1",
    title: "Dirty Deeds",
    artist: "AC/DC",
    album: "Dirty Deeds Done Dirt Cheap",
    albumId: "album-1",
    duration: 217,
    coverArt: "cover-1",
    starred: true,
    playCount: 9,
  });
});

test("mapSongsToQueue tolerates empty input and maps songs", () => {
  assert.deepEqual(mapSongsToQueue(null), []);
  assert.deepEqual(mapSongsToQueue(undefined), []);

  const queue = mapSongsToQueue([{ id: "1", title: "A", artist: "B", album: "C", duration: 10 }]);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].id, "1");
  assert.equal(queue[0].duration, 10);
});
