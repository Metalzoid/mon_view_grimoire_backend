const assert = require("assert");
const { test, describe, before, after } = require("node:test");
const mongoose = require("mongoose");

require("dotenv").config();

// Import du modèle User
const User = require("../../../models/user");

describe("User Model", () => {
  before(async () => {
    // Connexion à une base de données de test MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_TESTS_URI || "mongodb://localhost:27017"
      );
    }
  });

  after(async () => {
    // Nettoyage : supprimer toutes les collections de test
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  test("should create a user with all required fields", async () => {
    const userData = {
      email: "test@example.com",
      password: "password123",
    };

    const user = new User(userData);
    await user.validate();

    assert.strictEqual(user.email, userData.email);
    assert.strictEqual(user.password, userData.password);
  });

  test("should fail validation when email is missing", async () => {
    const userData = {
      password: "password123",
    };

    const user = new User(userData);

    try {
      await user.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.email, "Should have email validation error");
    }
  });

  test("should fail validation when password is missing", async () => {
    const userData = {
      email: "test@example.com",
    };

    const user = new User(userData);

    try {
      await user.validate();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(error.errors.password, "Should have password validation error");
    }
  });

  test("should fail validation when email is not unique", async () => {
    const userData = {
      email: "duplicate@example.com",
      password: "password123",
    };

    // Créer le premier utilisateur
    const user1 = new User(userData);
    await user1.save();

    // Essayer de créer un deuxième utilisateur avec le même email
    const user2 = new User(userData);

    try {
      await user2.save();
      assert.fail("Validation should have failed");
    } catch (error) {
      assert(
        error.code === 11000 || error.message.includes("unique"),
        "Should have unique constraint error"
      );
    }
  });

  test("should accept valid email format", async () => {
    const userData = {
      email: "valid.email@example.com",
      password: "password123",
    };

    const user = new User(userData);
    await user.validate();

    assert.strictEqual(user.email, userData.email);
  });

  test("should save user to database", async () => {
    const userData = {
      email: "save@example.com",
      password: "password123",
    };

    const user = new User(userData);
    const savedUser = await user.save();

    assert.strictEqual(savedUser.email, userData.email);
    assert(savedUser._id, "User should have an _id after saving");

    // Vérifier que l'utilisateur peut être récupéré
    const foundUser = await User.findById(savedUser._id);
    assert(foundUser, "User should be found in database");
    assert.strictEqual(foundUser.email, userData.email);
  });
});
