export function getAlbumDisplayName(album) {
  return album?.nom || album?.name || "Album";
}

export function getAlbumPhotos(album, allDiscoveries) {
  if (Array.isArray(album?.photos) && album.photos.length > 0) return album.photos;
  const photos = [];
  for (const id of album?.discoveryIds || []) {
    const d = allDiscoveries.find((x) => x.id === id);
    if (d?.photo) photos.push(d.photo);
  }
  if (photos.length === 0 && album?.coverPhoto) photos.push(album.coverPhoto);
  return photos;
}

export function getFirstDiscoveryPhoto(album, allDiscoveries) {
  const photos = getAlbumPhotos(album, allDiscoveries);
  return photos[0] || null;
}
