// TDD: Test for helpers/cloudinary.js
// Target: 100% coverage for uploadBuffer and deleteByPublicId
// Note: Mock cloudinary since it's external service

jest.mock("cloudinary", () => {
  const mockUploadStream = jest.fn();
  const mockDestroy = jest.fn();
  const mockConfig = jest.fn();
  
  return {
    v2: {
      config: mockConfig,
      uploader: {
        upload_stream: mockUploadStream,
        destroy: mockDestroy,
      },
    },
    __mockUploadStream: mockUploadStream,
    __mockDestroy: mockDestroy,
    __mockConfig: mockConfig,
  };
});

// Mock dotenv to prevent loading .env file during tests
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

const cloudinary = require("cloudinary").v2;
const { uploadBuffer, deleteByPublicId, DEFAULT_FOLDER } = require("../../helpers/cloudinary");

describe("Cloudinary Helper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear any pending timers
    jest.clearAllTimers();
  });

  describe("uploadBuffer", () => {
    it("should upload buffer with default options", (done) => {
      const mockBuffer = Buffer.from("test image data");
      const mockResult = {
        public_id: "test-id",
        secure_url: "https://res.cloudinary.com/test.jpg",
      };

      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        // Simulate successful upload - call callback immediately when end is called
        const stream = {
          end: jest.fn((buffer) => {
            expect(buffer).toBe(mockBuffer);
            // Call callback immediately (synchronously) in test mock
            callback(null, mockResult);
          }),
        };
        return stream;
      });

      uploadBuffer(mockBuffer)
        .then((result) => {
          expect(result).toEqual(mockResult);
          expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
            { folder: DEFAULT_FOLDER, overwrite: true },
            expect.any(Function)
          );
          done();
        })
        .catch(done);
    });

    it("should upload buffer with custom folder", (done) => {
      const mockBuffer = Buffer.from("test");
      const customFolder = "custom-folder";
      const mockResult = { public_id: "test-id" };

      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        return {
          end: jest.fn(() => {
            // Call callback synchronously in test (mock doesn't need async)
            callback(null, mockResult);
          }),
        };
      });

      uploadBuffer(mockBuffer, { folder: customFolder })
        .then((result) => {
          expect(result).toEqual(mockResult);
          expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
            { folder: customFolder, overwrite: true },
            expect.any(Function)
          );
          done();
        })
        .catch(done);
    });

    it("should upload buffer with public_id", (done) => {
      const mockBuffer = Buffer.from("test");
      const publicId = "my-public-id";
      const mockResult = { public_id: publicId };

      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        return {
          end: jest.fn(() => {
            // Call callback synchronously in test (mock doesn't need async)
            callback(null, mockResult);
          }),
        };
      });

      uploadBuffer(mockBuffer, { public_id: publicId })
        .then((result) => {
          expect(result).toEqual(mockResult);
          expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
            { folder: DEFAULT_FOLDER, overwrite: true, public_id: publicId },
            expect.any(Function)
          );
          done();
        })
        .catch(done);
    });

    it("should upload buffer with overwrite false", (done) => {
      const mockBuffer = Buffer.from("test");
      const mockResult = { public_id: "test-id" };

      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        return {
          end: jest.fn(() => {
            // Call callback synchronously in test (mock doesn't need async)
            callback(null, mockResult);
          }),
        };
      });

      uploadBuffer(mockBuffer, { overwrite: false })
        .then((result) => {
          expect(result).toEqual(mockResult);
          expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
            { folder: DEFAULT_FOLDER, overwrite: false },
            expect.any(Function)
          );
          done();
        })
        .catch(done);
    });

    it("should reject on upload error", (done) => {
      const mockBuffer = Buffer.from("test");
      const mockError = new Error("Upload failed");

      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        return {
          end: jest.fn(() => {
            // Call callback synchronously in test (mock doesn't need async)
            callback(mockError, null);
          }),
        };
      });

      uploadBuffer(mockBuffer)
        .then(() => {
          done(new Error("Should have rejected"));
        })
        .catch((error) => {
          expect(error).toBe(mockError);
          done();
        });
    });

    it("should handle empty buffer", (done) => {
      const mockBuffer = Buffer.from("");
      const mockResult = { public_id: "test-id" };

      cloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        return {
          end: jest.fn(() => {
            // Call callback synchronously in test (mock doesn't need async)
            callback(null, mockResult);
          }),
        };
      });

      uploadBuffer(mockBuffer)
        .then((result) => {
          expect(result).toEqual(mockResult);
          done();
        })
        .catch(done);
    });
  });

  describe("deleteByPublicId", () => {
    it("should delete image by public_id", async () => {
      const publicId = "test-public-id";
      const mockResult = { result: "ok" };

      cloudinary.uploader.destroy.mockResolvedValue(mockResult);

      const result = await deleteByPublicId(publicId);

      expect(result).toEqual(mockResult);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId, {
        invalidate: true,
      });
    });

    it("should handle delete error", async () => {
      const publicId = "test-public-id";
      const mockError = new Error("Delete failed");

      cloudinary.uploader.destroy.mockRejectedValue(mockError);

      await expect(deleteByPublicId(publicId)).rejects.toThrow("Delete failed");
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId, {
        invalidate: true,
      });
    });

    it("should delete with empty public_id", async () => {
      const publicId = "";
      const mockResult = { result: "not found" };

      cloudinary.uploader.destroy.mockResolvedValue(mockResult);

      const result = await deleteByPublicId(publicId);

      expect(result).toEqual(mockResult);
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicId, {
        invalidate: true,
      });
    });
  });

  describe("DEFAULT_FOLDER constant", () => {
    it("should export DEFAULT_FOLDER", () => {
      expect(DEFAULT_FOLDER).toBe("galindo-vehicles");
    });
  });
});

