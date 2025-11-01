const Book = require("../models/book");

exports.index = async (req, res, next) => {
  try {
    const books = await Book.find();
    return res.status(200).json(books);
  } catch (err) {
    return res.status(500).json({error: err})
  }
}
