const cloudinary = require('../config/cloudinary');

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Non-fatal: log and continue; we don't want a stale image to block the request.
    console.error('Cloudinary delete failed:', err.message);
  }
}

module.exports = { uploadBufferToCloudinary, deleteFromCloudinary };
