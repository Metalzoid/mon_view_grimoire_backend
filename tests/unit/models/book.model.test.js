const assert = require("assert");
const { test, describe, before, after } = require("node:test");
const mongoose = require("mongoose");

require("dotenv").config();

// Import du modèle Book
const Book = require("../../../models/book");

describe("Book Model", () => {
  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_TESTS_URI || "mongodb://localhost:27017"
      );
    }
  });

  after(async () => {
    await Book.deleteMany({});
    await mongoose.connection.close();
  });

  test("should create a book with all required fields", async () => {
    const bookData = {
      title: "Test Book",
      author: "Test Author",
      imageUrl: "http://example.com/image.jpg",
      year: 2023,
      genre: "Fiction",
      ratings: [
        { userId: "user1", grade: 5 },
        { userId: "user2", grade: 4 },
      ],
      averageRating: 0,
    };

    const book = new Book(bookData);
    await book.validate();

    assert.strictEqual(book.title, bookData.title);
    assert.strictEqual(book.author, bookData.author);
    assert.strictEqual(book.imageUrl, bookData.imageUrl);
    assert.strictEqual(book.year, bookData.year);
    assert.strictEqual(book.genre, bookData.genre);
    assert.strictEqual(book.ratings.length, 2);
    assert.strictEqual(book.averageRating, 4.5);
  });

  test("should calculate averageRating automatically when ratings are provided", async () => {
    const bookData = {
      title: "Test Book 2",
      author: "Test Author 2",
      imageUrl: "http://example.com/image2.jpg",
      year: 2024,
      genre: "Science Fiction",
      ratings: [
        { userId: "user1", grade: 3 },
        { userId: "user2", grade: 4 },
        { userId: "user3", grade: 5 },
      ],
    };

    const book = new Book(bookData);
    await book.validate();

    // (3 + 4 + 5) / 3 = 4
    assert.strictEqual(book.averageRating, 4);
  });

  test("should set averageRating to 0 when no ratings are provided", async () => {
    const bookData = {
      title: "Test Book 3",
      author: "Test Author 3",
      imageUrl: "http://example.com/image3.jpg",
      year: 2025,
      genre: "Mystery",
      ratings: [],
    };

    const book = new Book(bookData);
    await book.validate();

    assert.strictEqual(book.averageRating, 0);
  });

  test("should fail validation when title is missing", async () => {
    const bookData = {
      author: "Test Author",
      imageUrl: "http://example.com/image.jpg",
      year: 2023,
      genre: "Fiction",
      ratings: [],
    };

    const book = new Book(bookData);

    try {
      await book.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.title, "Should have title validation error");
    }
  });

  test("should fail validation when author is missing", async () => {
    const bookData = {
      title: "Test Book",
      imageUrl: "http://example.com/image.jpg",
      year: 2023,
      genre: "Fiction",
      ratings: [],
    };

    const book = new Book(bookData);

    try {
      await book.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.author, "Should have author validation error");
    }
  });

  test("should fail validation when imageUrl is missing", async () => {
    const bookData = {
      title: "Test Book",
      author: "Test Author",
      year: 2023,
      genre: "Fiction",
      ratings: [],
    };

    const book = new Book(bookData);

    try {
      await book.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.imageUrl, "Should have imageUrl validation error");
    }
  });

  test("should fail validation when year is missing", async () => {
    const bookData = {
      title: "Test Book",
      author: "Test Author",
      imageUrl: "http://example.com/image.jpg",
      genre: "Fiction",
      ratings: [],
    };

    const book = new Book(bookData);

    try {
      await book.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.year, "Should have year validation error");
    }
  });

  test("should fail validation when genre is missing", async () => {
    const bookData = {
      title: "Test Book",
      author: "Test Author",
      imageUrl: "http://example.com/image.jpg",
      year: 2023,
      ratings: [],
    };

    const book = new Book(bookData);

    try {
      await book.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.genre, "Should have genre validation error");
    }
  });

  test("should initialize ratings to empty array when missing", async () => {
    const bookData = {
      title: "Test Book",
      author: "Test Author",
      imageUrl: "http://example.com/image.jpg",
      year: 2023,
      genre: "Fiction",
    };

    const book = new Book(bookData);
    await book.validate();

    // Mongoose initialise automatiquement les tableaux requis à []
    assert(Array.isArray(book.ratings), "ratings should be an array");
    assert.strictEqual(book.ratings.length, 0, "ratings should be empty array");
    assert.strictEqual(
      book.averageRating,
      0,
      "averageRating should be 0 when no ratings"
    );
  });

  test("should allow userId to be optional", async () => {
    const bookData = {
      title: "Test Book",
      author: "Test Author",
      imageUrl: "http://example.com/image.jpg",
      year: 2023,
      genre: "Fiction",
      ratings: [],
    };

    const book = new Book(bookData);
    await book.validate();

    assert.strictEqual(book.userId, undefined);
  });

  test("should accept userId when provided", async () => {
    const bookData = {
      title: "Test Book",
      author: "Test Author",
      imageUrl: "http://example.com/image.jpg",
      year: 2023,
      genre: "Fiction",
      ratings: [],
      userId: "user123",
    };

    const book = new Book(bookData);
    await book.validate();

    assert.strictEqual(book.userId, "user123");
  });

  test("should recalculate averageRating when ratings change", async () => {
    const bookData = {
      title: "Test Book",
      author: "Test Author",
      imageUrl: "http://example.com/image.jpg",
      year: 2023,
      genre: "Fiction",
      ratings: [{ userId: "user1", grade: 5 }],
    };

    const book = new Book(bookData);
    await book.validate();
    assert.strictEqual(book.averageRating, 5);

    // Ajouter une nouvelle note
    book.ratings.push({ userId: "user2", grade: 3 });
    await book.validate();

    // (5 + 3) / 2 = 4
    assert.strictEqual(book.averageRating, 4);
  });
});
