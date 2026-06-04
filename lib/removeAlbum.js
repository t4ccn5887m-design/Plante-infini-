/** Remove an album (and its sub-albums). Discoveries are kept in storage. */
export function removeAlbumById(albumId, albums) {
  const toRemove = new Set([albumId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const album of albums) {
      if (album.parentId && toRemove.has(album.parentId) && !toRemove.has(album.id)) {
        toRemove.add(album.id);
        changed = true;
      }
    }
  }
  return albums.filter((a) => !toRemove.has(a.id));
}
