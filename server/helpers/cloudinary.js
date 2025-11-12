const cloudinary = require("cloudinary").v2;
require("dotenv").config(); // pastikan ini aktif di awal

// otomatis baca dari CLOUDINARY_URL di .env
cloudinary.config({ secure: true });

const DEFAULT_FOLDER = "galindo-vehicles";

function uploadBuffer(
  buffer,
  { folder = DEFAULT_FOLDER, public_id, overwrite = true } = {}
) {
  return new Promise((resolve, reject) => {
    const options = { folder, overwrite };
    if (public_id) options.public_id = public_id;

    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

function deleteByPublicId(publicId) {
  return cloudinary.uploader.destroy(publicId, { invalidate: true });
}

module.exports = { cloudinary, uploadBuffer, deleteByPublicId, DEFAULT_FOLDER };
