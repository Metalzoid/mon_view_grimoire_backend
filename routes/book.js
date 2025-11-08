const express = require("express");
const router = express.Router();
const multer = require('../middleware/multer-config');
const auth = require('../middleware/auth')

const bookController = require("../controllers/book");

// GETS
router.get("/", bookController.getAllBooks);
router.get("/bestrating", bookController.getBestRating);
router.get("/:id", bookController.getOneBook);

// POSTS
router.post("/", auth, multer, bookController.addOneBook);
router.post("/:id/rating", auth, bookController.addOneRating)

// PUTS
router.put("/:id", auth, multer, bookController.updateOneBook)

// DELETE
router.delete("/:id", auth, bookController.deleteBook);

module.exports = router;
