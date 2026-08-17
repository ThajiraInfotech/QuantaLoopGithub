const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const cloudinary = require("cloudinary").v2;

const MAX_MATERIAL_IMAGES = 3;
const LOCAL_UPLOAD_DIR = path.join(__dirname, "../../../uploads/materials");

function isCloudinaryConfigured(env) {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
  );
}

function getApiPublicOrigin(env) {
  return (env.API_PUBLIC_URL ?? `http://localhost:${env.PORT ?? 5000}`).replace(
    /\/$/,
    ""
  );
}

function getLocalUploadBaseUrl(env) {
  return `${getApiPublicOrigin(env)}/uploads/materials`;
}

function isAllowedMaterialImageUrl(url, env) {
  if (typeof url !== "string" || !url.trim()) return false;
  const trimmed = url.trim();

  if (isCloudinaryConfigured(env)) {
    const cloudinaryHost = `res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/`;
    if (trimmed.includes(cloudinaryHost)) return true;
  }

  const localBase = `${getLocalUploadBaseUrl(env)}/`;
  if (trimmed.startsWith(localBase)) return true;

  return false;
}

function sanitizeImageUrls(urls, env) {
  if (!Array.isArray(urls)) return [];
  const unique = [];
  for (const url of urls) {
    if (!isAllowedMaterialImageUrl(url, env)) continue;
    const trimmed = url.trim();
    if (!unique.includes(trimmed)) unique.push(trimmed);
    if (unique.length >= MAX_MATERIAL_IMAGES) break;
  }
  return unique;
}

async function ensureLocalUploadDir() {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
}

async function uploadToCloudinary(buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "quanta-loop/materials",
        resource_type: "image",
        format: mimeType === "image/png" ? "png" : undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function uploadToLocalDisk(buffer, mimeType, env) {
  await ensureLocalUploadDir();
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : mimeType === "image/gif"
          ? "gif"
          : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(LOCAL_UPLOAD_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `${getLocalUploadBaseUrl(env)}/${filename}`;
}

async function uploadMaterialImage(file, env) {
  if (!file?.buffer?.length) {
    throw new Error("No image file provided");
  }

  if (isCloudinaryConfigured(env)) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    return uploadToCloudinary(file.buffer, file.mimetype);
  }

  // Local VPS disk fallback. In production, API_PUBLIC_URL must be the public origin
  // (e.g. https://www.quantaloop.in) so stored image URLs are reachable.
  if (env.NODE_ENV === "production" && !env.API_PUBLIC_URL) {
    throw new Error(
      "Image uploads require API_PUBLIC_URL when not using Cloudinary"
    );
  }

  return uploadToLocalDisk(file.buffer, file.mimetype, env);
}

module.exports = {
  MAX_MATERIAL_IMAGES,
  LOCAL_UPLOAD_DIR,
  isCloudinaryConfigured,
  isAllowedMaterialImageUrl,
  sanitizeImageUrls,
  uploadMaterialImage,
  getLocalUploadBaseUrl,
};
