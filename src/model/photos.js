import { createPhoto } from './schema.js';

export function addPhoto(state, entityId, meta = {}) {
  const photo = createPhoto(entityId, meta);
  const next = { ...state, photos: [...state.photos, photo] };
  return next;
}

function setEntityAvatar(state, entityId, photoId) {
  const characters = state.characters.map((c) => {
    if (c.id !== entityId) {
      return c;
    }
    const updated = { ...c, avatarPhotoId: photoId };
    return updated;
  });
  const groups = state.groups.map((g) => {
    if (g.id !== entityId) {
      return g;
    }
    const updated = { ...g, avatarPhotoId: photoId };
    return updated;
  });
  const next = { ...state, characters, groups };
  return next;
}

export function setAvatar(state, entityId, photoId) {
  const next = setEntityAvatar(state, entityId, photoId);
  return next;
}

export function clearAvatar(state, entityId) {
  const next = setEntityAvatar(state, entityId, null);
  return next;
}

export function removePhoto(state, photoId) {
  const photos = state.photos.filter((p) => p.id !== photoId);
  const characters = state.characters.map((c) => {
    const wasAvatar = c.avatarPhotoId === photoId;
    if (!wasAvatar) {
      return c;
    }
    const updated = { ...c, avatarPhotoId: null };
    return updated;
  });
  const groups = state.groups.map((g) => {
    const wasAvatar = g.avatarPhotoId === photoId;
    if (!wasAvatar) {
      return g;
    }
    const updated = { ...g, avatarPhotoId: null };
    return updated;
  });
  const next = { ...state, photos, characters, groups };
  return next;
}

export function updatePhotoMeta(state, photoId, patch) {
  const photos = state.photos.map((p) => {
    if (p.id !== photoId) {
      return p;
    }
    const updated = { ...p, ...patch };
    return updated;
  });
  const next = { ...state, photos };
  return next;
}

export function listPhotos(state, entityId) {
  const list = state.photos
    .filter((p) => p.entityId === entityId)
    .sort((a, b) => a.createdAt - b.createdAt);
  return list;
}
