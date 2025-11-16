const Book = require("../models/book");
const path = require("path");
const fs = require("fs");

exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();

    return res.status(200).json(books);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getBestRating = async (req, res, next) => {
  try {
    const books = await Book.find().sort("-averageRating").limit(3);
    return res.status(200).json(books);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.addOneBook = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const bookObject = JSON.parse(req.body.book);

    const book = new Book({
      title: bookObject.title,
      author: bookObject.author,
      year: bookObject.year,
      genre: bookObject.genre,
      ratings: bookObject.ratings,
      userId: bookObject.userId,
      imageUrl: formatImageUrl(req, req.file.filename),
    });

    await book.save();
    return res
      .status(201)
      .json({ message: `${bookObject.title} successfully saved!` });
  } catch (err) {
    if (req.file) {
      deleteImageSync(req.file.filename);
    }
    console.log(err.message);

    return res.status(500).json({ message: err.message });
  }
};

exports.addOneRating = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: "Book not found!" });
    }

    const existingRatings = book.ratings;
    const newRating = {
      userId: req.body.userId,
      grade: req.body.rating,
    };

    if (existingRatings.some((r) => r.userId === newRating.userId)) {
      return res
        .status(403)
        .json({ message: "UserId already rating this book !" });
    }

    book.ratings.push(newRating);
    await book.save();

    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });

    if (!book) {
      if (req.file) {
        deleteImageSync(req.file.filename);
      }
      return res.status(404).json({ message: "Book not found." });
    }

    const authError = authenticateUser(req, res, book.userId);
    if (authError) {
      if (req.file) {
        deleteImageSync(req.file.filename);
      }
      return authError;
    }

    const params = {};
    let oldImageUrl = null;

    if (req.file) {
      oldImageUrl = book.imageUrl;
      const bookObject = req.body.book ? JSON.parse(req.body.book) : req.body;
      Object.assign(params, {
        title: bookObject.title,
        author: bookObject.author,
        year: bookObject.year,
        genre: bookObject.genre,
        imageUrl: formatImageUrl(req, req.file.filename),
      });
    } else {
      const bookObject = req.body;
      Object.assign(params, {
        title: bookObject.title,
        author: bookObject.author,
        year: bookObject.year,
        genre: bookObject.genre,
      });
    }

    book.set(params);
    await book.save();

    if (oldImageUrl) {
      deleteImage(oldImageUrl);
    }

    return res.status(200).json({ message: "Book successfully updated." });
  } catch (err) {
    if (req.file) {
      deleteImageSync(req.file.filename);
    }
    console.log(err.message);
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params?.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    const authError = authenticateUser(req, res, book.userId);
    if (authError) {
      return authError;
    }

    await Book.deleteOne({ _id: req.params.id });

    deleteImage(book.imageUrl);

    return res.status(200).json({ message: "Book successfully deleted." });
  } catch (err) {
    console.log(err.message);

    return res.status(500).json({ message: err.message });
  }
};

const deleteImage = (imageUrl) => {
  if (!imageUrl) {
    return;
  }

  try {
    const imageFileName = imageUrl.split("/images/")[1];
    if (!imageFileName) {
      console.warn("Invalid image URL format:", imageUrl);
      return;
    }

    const imagePath = path.join(__dirname, "..", "images", imageFileName);
    fs.unlink(imagePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Error deleting image:", err.message);
      }
    });
  } catch (error) {
    console.error("Error processing image deletion:", error.message);
  }
};

const deleteImageSync = (filename) => {
  if (!filename) {
    return;
  }

  try {
    const imagePath = path.join(__dirname, "..", "images", filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (error) {
    console.error("Error deleting image synchronously:", error.message);
  }
};

const formatImageUrl = (req, imageUrl) => {
  return `${req.protocol}://${req.get("host")}/images/${imageUrl}`;
};

const authenticateUser = (req, res, bookUserId) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const userId = bookUserId || req.body.userId;
  if (req.auth.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  return null;
};
