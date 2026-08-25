export const MAX_MATERIAL_PHOTOS = 3;
export const MAX_MATERIAL_PHOTO_BYTES = 5 * 1024 * 1024;
export const MATERIAL_PHOTO_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

const ALLOWED_MATERIAL_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isAllowedMaterialPhotoFile(file: File): boolean {
  const type = file.type.trim().toLowerCase();
  if (ALLOWED_MATERIAL_PHOTO_TYPES.has(type)) return true;
  if (type) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

