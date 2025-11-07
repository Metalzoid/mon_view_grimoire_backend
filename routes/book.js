const express = require("express");
const router = express.Router();
const multer = require('../middleware/multer-config');

const bookController = require("../controllers/book");

// GETS
router.get("/", bookController.getAllBooks);
router.get("/bestrating", bookController.getBestRating);
router.get("/:id", bookController.getOneBook);

// POSTS
router.post("/", multer, bookController.addBook)
module.exports = router;
