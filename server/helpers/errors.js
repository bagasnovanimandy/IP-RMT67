class BadRequest extends Error {
  constructor(message = "Bad Request") {
    super(message);
    this.name = "BadRequest";
  }
}
class Unauthorized extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "Unauthorized";
  }
}
class Forbidden extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "Forbidden";
  }
}
class NotFound extends Error {
  constructor(message = "Not Found") {
    super(message);
    this.name = "NotFound";
  }
}

module.exports = { BadRequest, Unauthorized, Forbidden, NotFound };
