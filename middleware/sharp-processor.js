const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

module.exports = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const originalPath = req.file.path;
    const originalExtension = path.extname(originalPath);
    const baseName = originalPath.replace(originalExtension, "");

    const webpPath = `${baseName}.webp`;

    await sharp(originalPath)
      .resize(300, 300)
      .webp({ quality: 87 })
      .toFile(webpPath);

    fs.unlinkSync(originalPath);

    req.file.filename = path.basename(webpPath);

    next();
  } catch (error) {
    if (req.file && req.file.path) {
      try {
        const originalPath = req.file.path;
        const originalExtension = path.extname(originalPath);
        const baseName = originalPath.replace(originalExtension, "");

        const webpPath = `${baseName}.webp`;

        if (fs.existsSync(webpPath)) {
          fs.unlinkSync(webpPath);
        }
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up files:", cleanupError);
      }
    }

    console.error("Error processing image with Sharp:", error);
    return res.status(500).json({
      message: "Error processing image",
    });
  }
};
