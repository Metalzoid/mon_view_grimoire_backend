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

    // Si l'image est déjà en WebP, on crée un nom temporaire pour éviter le conflit
    const webpPath =
      originalExtension.toLowerCase() === ".webp"
        ? `${baseName}_processed.${Date.now()}.webp`
        : `${baseName}.webp`;

    await sharp(originalPath)
      .resize(300, 300)
      .webp({ quality: 87 })
      .toFile(webpPath);

    // Supprimer l'original seulement si ce n'est pas le même fichier que le WebP
    if (originalPath !== webpPath) {
      fs.unlinkSync(originalPath);
    }

    req.file.filename = path.basename(webpPath);
    req.file.path = webpPath;

    next();
  } catch (error) {
    if (req.file && req.file.path) {
      try {
        const originalPath = req.file.path;
        const originalExtension = path.extname(originalPath);
        const baseName = originalPath.replace(originalExtension, "");

        // Nettoyer tous les fichiers WebP potentiels (y compris ceux avec timestamp)
        const webpPattern = path.join(
          path.dirname(originalPath),
          path.basename(baseName) + "*.webp"
        );
        const files = fs.readdirSync(path.dirname(originalPath));
        files.forEach((file) => {
          if (
            file.startsWith(path.basename(baseName)) &&
            file.endsWith(".webp")
          ) {
            const filePath = path.join(path.dirname(originalPath), file);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        });

        // Supprimer l'original seulement si ce n'est pas déjà un WebP
        if (
          originalExtension.toLowerCase() !== ".webp" &&
          fs.existsSync(originalPath)
        ) {
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
