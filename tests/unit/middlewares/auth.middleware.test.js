const assert = require("assert");
const { test, describe, before } = require("node:test");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const authMiddleware = require("../../../middleware/auth");

describe("authMiddleware", () => {
  before(() => {
    process.env.SECURE_KEY = "test-secure-key";
  });

  test("should return 401 if no token is provided", () => {
    const req = {
      headers: {},
    };
    let responseStatus = null;
    let responseData = null;
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      },
    };
    const next = () => {
      assert.fail("next() should not be called");
    };
    authMiddleware(req, res, next);

    assert.strictEqual(responseStatus, 401, "Status should be 401");
    assert.strictEqual(
      responseData.message,
      "No token provided",
      "Error message should be 'No token provided'"
    );
  });

  test("should return 401 if the token is invalid", () => {
    const req = {
      headers: {
        authorization: "Bearer invalid-token",
      },
    };
    let responseStatus = null;
    let responseData = null;
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      },
    };
    const next = () => {
      assert.fail("next() should not be called");
    };
    authMiddleware(req, res, next);

    assert.strictEqual(responseStatus, 401, "Status should be 401");
    assert.strictEqual(
      responseData.message,
      "Invalid token",
      "Error message should be 'Invalid token'"
    );
  });

  test("should call next() if the token is valid", () => {
    const userId = "test-user-id";
    const validToken = jwt.sign({ userId }, process.env.SECURE_KEY);
    const req = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    };
    let responseStatus = null;
    let responseData = null;
    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      },
    };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    authMiddleware(req, res, next);

    assert.strictEqual(nextCalled, true, "next() should be called");
    assert.strictEqual(
      req.auth.userId,
      userId,
      "req.auth.userId should be set"
    );
    assert.strictEqual(responseStatus, null, "Status should not be set");
    assert.strictEqual(responseData, null, "Response data should not be set");
  });
});
