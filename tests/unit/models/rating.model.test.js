const assert = require("assert");
const { test, describe, before, after } = require("node:test");
const mongoose = require("mongoose");

require("dotenv").config();

// Import du schéma rating
const ratingSchema = require("../../../models/rating");

// Créer un modèle temporaire pour tester le schéma rating
// Note: ratingSchema est déjà un Schema, on peut l'utiliser directement
const Rating = mongoose.model("Rating", ratingSchema);

describe("Rating Schema", () => {
  before(async () => {
    // Connexion à une base de données de test MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/test"
      );
    }
  });

  after(async () => {
    // Nettoyage : supprimer toutes les collections de test
    await Rating.deleteMany({});
    await mongoose.connection.close();
  });

  test("should create a rating with all required fields", async () => {
    const ratingData = {
      userId: "user123",
      grade: 5,
    };

    const rating = new Rating(ratingData);
    await rating.validate();

    assert.strictEqual(rating.userId, ratingData.userId);
    assert.strictEqual(rating.grade, ratingData.grade);
  });

  test("should fail validation when userId is missing", async () => {
    const ratingData = {
      grade: 5,
    };

    const rating = new Rating(ratingData);

    try {
      await rating.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.userId, "Should have userId validation error");
    }
  });

  test("should fail validation when grade is missing", async () => {
    const ratingData = {
      userId: "user123",
    };

    const rating = new Rating(ratingData);

    try {
      await rating.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.grade, "Should have grade validation error");
    }
  });

  test("should accept valid grade values", async () => {
    const validGrades = [1, 2, 3, 4, 5];

    for (const grade of validGrades) {
      const ratingData = {
        userId: "user123",
        grade: grade,
      };

      const rating = new Rating(ratingData);
      await rating.validate();

      assert.strictEqual(rating.grade, grade);
    }
  });

  test("should accept grade as number", async () => {
    const ratingData = {
      userId: "user123",
      grade: 4.5,
    };

    const rating = new Rating(ratingData);
    await rating.validate();

    assert.strictEqual(rating.grade, 4.5);
  });

  test("should accept different userId values", async () => {
    const userIds = ["user1", "user2", "user-123", "user_456"];

    for (const userId of userIds) {
      const ratingData = {
        userId: userId,
        grade: 5,
      };

      const rating = new Rating(ratingData);
      await rating.validate();

      assert.strictEqual(rating.userId, userId);
    }
  });

  test("should save rating to database", async () => {
    const ratingData = {
      userId: "user-save",
      grade: 5,
    };

    const rating = new Rating(ratingData);
    const savedRating = await rating.save();

    assert.strictEqual(savedRating.userId, ratingData.userId);
    assert.strictEqual(savedRating.grade, ratingData.grade);
    assert(savedRating._id, "Rating should have an _id after saving");

    // Vérifier que le rating peut être récupéré
    const foundRating = await Rating.findById(savedRating._id);
    assert(foundRating, "Rating should be found in database");
    assert.strictEqual(foundRating.userId, ratingData.userId);
    assert.strictEqual(foundRating.grade, ratingData.grade);
  });

  test("should allow multiple ratings with same userId", async () => {
    const userId = "user-multiple";
    const ratings = [
      { userId: userId, grade: 3 },
      { userId: userId, grade: 4 },
      { userId: userId, grade: 5 },
    ];

    const savedRatings = [];
    for (const ratingData of ratings) {
      const rating = new Rating(ratingData);
      const saved = await rating.save();
      savedRatings.push(saved);
    }

    assert.strictEqual(savedRatings.length, 3);
    savedRatings.forEach((rating, index) => {
      assert.strictEqual(rating.userId, userId);
      assert.strictEqual(rating.grade, ratings[index].grade);
    });
  });
});
