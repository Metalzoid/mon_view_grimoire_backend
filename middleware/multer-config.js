const multer = require("multer");
const path = require("path");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_");
    const nameWithoutExtension = path.parse(name).name;
    const extension = MIME_TYPES[file.mimetype];
    callback(null, nameWithoutExtension + "." + Date.now() + "." + extension);
  },
});

module.exports = multer({ storage }).single("image");
