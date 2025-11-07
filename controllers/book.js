const Book = require("../models/book");
const Rating = require("../models/rating");
const path = require("path");
const fs = require("fs");

exports.getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find();

    return res.status(200).json(books);
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

exports.getOneBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id })
    console.log(book);

    if (!book) {
      return res.status(401).json({ message: "Book not found"});
    }

    return res.status(200).json(book)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

exports.getBestRating = async (req, res, next) => {
  try {
    const books = await Book.find().sort('-averageRating').limit(3)
    return res.status(200).json(books)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

exports.addBook = async (req, res, next) => {
  try {
    // Parse l'objet book reçu en JSON, car multer retourne uniquement du JSON
    const bookObject = JSON.parse(req.body.book);
    const ratings = bookObject.ratings;
    const averageRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.grade, 0) / ratings.length
        : 0;

    const book = new Book({
      title: bookObject.title,
      author: bookObject.author,
      year: bookObject.year,
      genre: bookObject.genre,
      averageRating: averageRating,
      ratings: bookObject.ratings,
      userId: bookObject.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    });

    await book.save();
    return res.status(201).json({ message: `${bookObject.title} successfully saved!` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params?.id)

    if (!book) {
      return res.status(404).json({ message: "Book not found."})
    }

    if (book.imageUrl) {
      const imageFileName = book.imageUrl.split('/images/')[1];
      const imagePath = path.join(__dirname, '..', 'images', imageFileName);
      fs.unlink(imagePath, (err) => {
        if (err) {
          return res.status(500).json({ message: err.message })
        }
      });
    }

    await Book.deleteOne({ _id: req.params.id })

    return res.status(200).json({ message: 'Book successfully deleted.'})
  } catch (err) {
    console.log(err.message);

    return res.status(500).json({ message: err.message })
  }
}
