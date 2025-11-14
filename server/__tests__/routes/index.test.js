// TDD: Test for routes/index.js
// Target: Verify routes are registered correctly

const express = require("express");
const router = require("../../routes/index");

describe("Routes Index", () => {
  it("should export router", () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe("function");
  });

  it("should be an Express router instance", () => {
    // Router should have Express router methods
    expect(typeof router.use).toBe("function");
    expect(typeof router.get).toBe("function");
    expect(typeof router.post).toBe("function");
  });
});

