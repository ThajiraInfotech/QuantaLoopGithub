const multer = require("multer");

const { AppError } = require("../utils/AppError");

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new AppError(
          "Only JPEG, PNG, WebP, and GIF images are allowed",
          400,
          "INVALID_IMAGE"
        )
      );
      return;
    }
    cb(null, true);
  },
});

function uploadMaterialImageMiddleware(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof AppError) {
      next(err);
      return;
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      next(
        new AppError("Image must be 5 MB or smaller", 400, "FILE_TOO_LARGE")
      );
      return;
    }
    next(new AppError(err.message || "Invalid image upload", 400, "INVALID_IMAGE"));
  });
}

module.exports = { uploadMaterialImageMiddleware };
