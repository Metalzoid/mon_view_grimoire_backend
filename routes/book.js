const express = require("express");
const router = express.Router();
const multer = require('../middleware/multer-config');

const bookController = require("../controllers/book");

// GETS
router.get("/", bookController.getAllBooks);
router.get("/bestrating", bookController.getBestRating);
router.get("/:id", bookController.getOneBook);

// POSTS
router.post("/", multer, bookController.addOneBook);
router.post("/:id/rating", bookController.addOneRating)

// PUTS
router.put("/:id", multer, bookController.updateOneBook)

// DELETE
router.delete("/:id", bookController.deleteBook);

module.exports = router;
