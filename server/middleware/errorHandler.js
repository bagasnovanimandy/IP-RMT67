function parseSequelize(err) {
  if (err?.name?.includes("Sequelize")) {
    const messages = [];
    if (Array.isArray(err.errors)) {
      for (const e of err.errors) {
        messages.push(e.message || `${e.path}: ${e.type}`);
      }
    }
    // Jika tidak ada error detail, cek error message utama
    if (messages.length === 0 && err.message) {
      messages.push(err.message);
    }
    return messages.join(", ") || "Invalid data";
  }
  return null;
}

module.exports = function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== "production";

  const map = {
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
  };

  let status = map[err?.name] || 500;
  let message = err?.message || "Internal Server Error";

  const seqMsg = parseSequelize(err);
  if (seqMsg) {
    status = status === 500 ? 400 : status;
    message = seqMsg;
  }

  if (status === 500 && isDev) {
    console.error("ERR:", err);
  }

  res.status(status).json({ message });
};
