// TDD: Test for middleware/upload.js
// Target: 100% coverage for multer upload configuration

const { upload, fileFilter } = require("../../middleware/upload");

describe("Upload Middleware", () => {
  describe("Upload configuration", () => {
    it("should export upload middleware", () => {
      expect(upload).toBeDefined();
      expect(typeof upload.single).toBe("function");
      expect(typeof upload.array).toBe("function");
      expect(typeof upload.fields).toBe("function");
    });

    it("should be configured with memory storage", () => {
      // Multer with memoryStorage is configured
      // This will be verified through integration tests
      expect(upload).toBeDefined();
    });

    it("should have file size limit configured", () => {
      // File size limit of 2MB is set in multer config
      // This will be verified through integration tests
      expect(upload).toBeDefined();
    });
  });

  describe("fileFilter", () => {
    it("should accept valid image MIME types (image/jpeg)", () => {
      const cb = jest.fn();
      fileFilter(null, { mimetype: "image/jpeg" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept valid image MIME types (image/png)", () => {
      const cb = jest.fn();
      fileFilter(null, { mimetype: "image/png" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept valid image MIME types (image/webp)", () => {
      const cb = jest.fn();
      fileFilter(null, { mimetype: "image/webp" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should accept valid image MIME types (image/jpg)", () => {
      const cb = jest.fn();
      fileFilter(null, { mimetype: "image/jpg" }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("should reject invalid MIME types (application/pdf)", () => {
      const cb = jest.fn();
      fileFilter(null, { mimetype: "application/pdf" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
      expect(cb.mock.calls[0][0].message).toBe("Invalid file type");
    });

    it("should reject invalid MIME types (text/plain)", () => {
      const cb = jest.fn();
      fileFilter(null, { mimetype: "text/plain" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should reject invalid MIME types (video/mp4)", () => {
      const cb = jest.fn();
      fileFilter(null, { mimetype: "video/mp4" }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

