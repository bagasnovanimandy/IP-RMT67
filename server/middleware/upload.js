// middleware/upload.js
const multer = require("multer");

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!ok.includes(file.mimetype)) return cb(new Error("Invalid file type"));
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = { upload, fileFilter };
