const express = require("express");
const router = express.Router();
const multer = require('../middleware/multer-config');
const sharpProcessor = require('../middleware/sharp-processor');
const auth = require('../middleware/auth')

const bookController = require("../controllers/book");

// GETS
router.get("/", bookController.getAllBooks);
router.get("/bestrating", bookController.getBestRating);
router.get("/:id", bookController.getOneBook);

// POSTS
router.post("/", auth, multer, sharpProcessor, bookController.addOneBook);
router.post("/:id/rating", auth, bookController.addOneRating)

// PUTS
router.put("/:id", auth, multer, sharpProcessor, bookController.updateOneBook)

// DELETE
router.delete("/:id", auth, bookController.deleteBook);

module.exports = router;
