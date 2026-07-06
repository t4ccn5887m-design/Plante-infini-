function pickAlbumCover(album, discoveries) {
  const ids = album.discoveryIds || [];
  for (const id of ids) {
    const d = discoveries.find((x) => x.id === id);
    if (d?.photo) return d.photo;
  }
  return null;
}

/** Remove a discovery from lists and album references. */
export function removeDiscoveryById(discoveryId, discoveries, albums) {
  if (!discoveryId) return null;
  const updatedDiscoveries = discoveries.filter((d) => d.id !== discoveryId);
  if (updatedDiscoveries.length === discoveries.length) return null;

  const updatedAlbums = albums.map((album) => {
    const ids = (album.discoveryIds || []).filter((id) => id !== discoveryId);
    if (ids.length === (album.discoveryIds || []).length) return album;
    const coverPhoto = ids.length ? pickAlbumCover({ ...album, discoveryIds: ids }, updatedDiscoveries) : null;
    return { ...album, discoveryIds: ids, coverPhoto };
  });

  return { discoveries: updatedDiscoveries, albums: updatedAlbums };
}
