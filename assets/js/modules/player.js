export function formatTime(sec) {
  const safe = Math.max(0, Math.floor(sec || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function toTrack(song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    albumId: song.albumId,
    duration: Number(song.duration || 0),
    coverArt: song.coverArt,
    suffix: song.suffix || "",
    bitRate: Number(song.bitRate || 0),
    contentType: song.contentType || "",
    transcodedContentType: song.transcodedContentType || "",
    starred: !!song.starred,
    playCount: Number(song.playCount || 0),
  };
}

export function mapSongsToQueue(songs) {
  return (songs || []).map((song) => toTrack(song));
}
