const Book = require("../models/book");
const Rating = require("../models/rating");

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
    const book = await Book.findOne({_id: req.params.id})

    return res.status(200).json(book)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

exports.addBook = async (req, res, next) => {
  try {
    // Parse l'objet book reçu en JSON
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
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    });

    await book.save();
    return res.status(201).json({ message: `${bookObject.title} successfully saved!` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
