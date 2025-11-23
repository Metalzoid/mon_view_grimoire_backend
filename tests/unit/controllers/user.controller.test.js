const assert = require("assert");
const { test, describe, before, after, beforeEach } = require("node:test");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

// Import du modèle User et du controller
const User = require("../../../models/user");
const userController = require("../../../controllers/user");

// Helper function pour créer un objet res mocké qui retourne une promesse
function createMockRes() {
  let responseStatus = null;
  let responseData = null;
  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  const res = {
    status: (code) => {
      responseStatus = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      resolvePromise({ status: responseStatus, data: responseData });
      return res;
    },
  };

  return {
    res,
    promise,
    getStatus: () => responseStatus,
    getData: () => responseData,
  };
}

describe("User Controller", () => {
  before(async () => {
    // Connexion à une base de données de test MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGODB_TESTS_URI || "mongodb://localhost:27017"
      );
    }
    // S'assurer que SECURE_KEY est défini
    if (!process.env.SECURE_KEY) {
      process.env.SECURE_KEY = "test-secure-key";
    }
  });

  beforeEach(async () => {
    // Nettoyage avant chaque test
    await User.deleteMany({});
  });

  after(async () => {
    // Nettoyage final : supprimer toutes les collections de test
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe("signup", () => {
    test("should create a new user successfully", async () => {
      const req = {
        body: {
          email: "newuser@example.com",
          password: "password123",
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      userController.signup(req, mockRes.res, next);
      await mockRes.promise;

      assert.strictEqual(mockRes.getStatus(), 201, "Status should be 201");
      assert.strictEqual(
        mockRes.getData().message,
        "User created!",
        "Should return success message"
      );

      // Vérifier que l'utilisateur a été créé dans la base de données
      const user = await User.findOne({ email: req.body.email });
      assert(user, "User should be created in database");
      assert.strictEqual(user.email, req.body.email, "Email should match");

      // Vérifier que le mot de passe est hashé
      const isPasswordHashed = await bcrypt.compare(
        req.body.password,
        user.password
      );
      assert(
        isPasswordHashed,
        "Password should be hashed and match the original"
      );
    });

    test("should return 400 when email already exists", async () => {
      // Créer un utilisateur existant
      const existingUser = new User({
        email: "existing@example.com",
        password: await bcrypt.hash("password123", 10),
      });
      await existingUser.save();

      const req = {
        body: {
          email: "existing@example.com",
          password: "password123",
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      userController.signup(req, mockRes.res, next);
      await mockRes.promise;

      assert.strictEqual(mockRes.getStatus(), 400, "Status should be 400");
      assert(mockRes.getData().message, "Should return an error message");
    });

    test("should return 500 when bcrypt hash fails", async () => {
      // Mock bcrypt.hash pour simuler une erreur
      const originalHash = bcrypt.hash;
      bcrypt.hash = () => Promise.reject(new Error("Hash error"));

      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      try {
        userController.signup(req, mockRes.res, next);
        await mockRes.promise;
      } finally {
        // Restaurer la fonction originale
        bcrypt.hash = originalHash;
      }

      assert.strictEqual(mockRes.getStatus(), 500, "Status should be 500");
      assert(mockRes.getData().message, "Should return an error message");
    });

    test("should return 400 when user save fails", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      // Mock User.prototype.save pour simuler une erreur
      const originalSave = User.prototype.save;
      User.prototype.save = function () {
        return Promise.reject(new Error("Save error"));
      };

      try {
        userController.signup(req, mockRes.res, next);
        await mockRes.promise;
      } finally {
        // Restaurer la fonction originale
        User.prototype.save = originalSave;
      }

      assert.strictEqual(mockRes.getStatus(), 400, "Status should be 400");
      assert(mockRes.getData().message, "Should return an error message");
    });
  });

  describe("login", () => {
    test("should login successfully with valid credentials", async () => {
      // Créer un utilisateur de test
      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);
      const testUser = new User({
        email: "login@example.com",
        password: hashedPassword,
      });
      await testUser.save();

      const req = {
        body: {
          email: "login@example.com",
          password: password,
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      userController.login(req, mockRes.res, next);
      await mockRes.promise;

      assert.strictEqual(mockRes.getStatus(), 200, "Status should be 200");
      assert(mockRes.getData().userId, "Should return userId");
      assert(mockRes.getData().token, "Should return token");

      // Vérifier que le token est valide
      const decoded = jwt.verify(
        mockRes.getData().token,
        process.env.SECURE_KEY
      );
      assert.strictEqual(
        decoded.userId,
        testUser._id.toString(),
        "Token should contain correct userId"
      );
    });

    test("should return 401 when user does not exist", async () => {
      const req = {
        body: {
          email: "nonexistent@example.com",
          password: "password123",
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      userController.login(req, mockRes.res, next);
      await mockRes.promise;

      assert.strictEqual(mockRes.getStatus(), 401, "Status should be 401");
      assert.strictEqual(
        mockRes.getData().message,
        "Login failed",
        "Should return login failed message"
      );
    });

    test("should return 401 when password is incorrect", async () => {
      // Créer un utilisateur de test
      const hashedPassword = await bcrypt.hash("correctpassword", 10);
      const testUser = new User({
        email: "wrongpass@example.com",
        password: hashedPassword,
      });
      await testUser.save();

      const req = {
        body: {
          email: "wrongpass@example.com",
          password: "wrongpassword",
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      userController.login(req, mockRes.res, next);
      await mockRes.promise;

      assert.strictEqual(mockRes.getStatus(), 401, "Status should be 401");
      assert.strictEqual(
        mockRes.getData().message,
        "Login failed",
        "Should return login failed message"
      );
    });

    test("should return 500 when User.findOne fails", async () => {
      const req = {
        body: {
          email: "error@example.com",
          password: "password123",
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      // Mock User.findOne pour simuler une erreur
      const originalFindOne = User.findOne;
      User.findOne = () => Promise.reject(new Error("Database error"));

      try {
        userController.login(req, mockRes.res, next);
        await mockRes.promise;
      } finally {
        // Restaurer la fonction originale
        User.findOne = originalFindOne;
      }

      assert.strictEqual(mockRes.getStatus(), 500, "Status should be 500");
      assert(mockRes.getData().message, "Should return an error message");
    });

    test("should return 500 when bcrypt.compare fails", async () => {
      // Créer un utilisateur de test
      const hashedPassword = await bcrypt.hash("password123", 10);
      const testUser = new User({
        email: "bcrypterror@example.com",
        password: hashedPassword,
      });
      await testUser.save();

      const req = {
        body: {
          email: "bcrypterror@example.com",
          password: "password123",
        },
      };

      const mockRes = createMockRes();
      const next = () => {};

      // Mock bcrypt.compare pour simuler une erreur
      const originalCompare = bcrypt.compare;
      bcrypt.compare = () => Promise.reject(new Error("Compare error"));

      try {
        userController.login(req, mockRes.res, next);
        await mockRes.promise;
      } finally {
        // Restaurer la fonction originale
        bcrypt.compare = originalCompare;
      }

      assert.strictEqual(mockRes.getStatus(), 500, "Status should be 500");
      assert(mockRes.getData().message, "Should return an error message");
    });
  });
});
