const Book = require("../models/book");
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

exports.addOneBook = async (req, res, next) => {
  try {
    // Parse l'objet book reçu en JSON, car multer retourne uniquement du JSON
    const bookObject = JSON.parse(req.body.book);

    const book = new Book({
      title: bookObject.title,
      author: bookObject.author,
      year: bookObject.year,
      genre: bookObject.genre,
      ratings: bookObject.ratings,
      userId: bookObject.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });

    await book.save();
    return res.status(201).json({ message: `${bookObject.title} successfully saved!` });
  } catch (err) {
    console.log(err.message);

    return res.status(500).json({ message: err.message });
  }
};

exports.addOneRating = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: "Book not found!"})
    }

    const existingRatings = book.ratings;
    const newRating = {
      userId: req.body.userId,
      grade: req.body.rating
    }

    if (existingRatings.some(r => r.userId === newRating.userId)) {
      return res.status(403).json({ message: "UserId already rating this book !" })
    }

    book.ratings.push(newRating)
    await book.save()

    return res.status(200).json(book)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateOneBook =  async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id })

    if (!book) {
      return res.status(404).json({ message: 'Book not found.'})
    }
    const params = {}

    if (req.file) {
      const bookObject = JSON.parse(req.body.book);
      Object.assign(params, {
        title: bookObject.title,
        author: bookObject.author,
        year: bookObject.year,
        genre: bookObject.genre,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      })
    } else {
      const bookObject = req.body;
      Object.assign(params, {
        title: bookObject.title,
        author: bookObject.author,
        year: bookObject.year,
        genre: bookObject.genre,
      })
    }
    book.set(params)
    await book.save()
    return res.status(200).json({ message: "Book successfully updated."})
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: err.message })
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
