'use strict';

class BadRequest extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }

  toJSON() {
    return {
      message: this.message.toString(),
      status: this.status
    }
  }
}

class NotFound extends Error {
  constructor(message) {
    super(message);
    this.status = 404;
  }

  toJSON() {
    return {
      message: this.message.toString(),
      status: this.status
    }
  }
}

class GatewayTimeout extends Error {
  constructor(message) {
    super(message);
    this.status = 504;
  }

  toJSON() {
    return {
      message: this.message.toString(),
      status: this.status
    }
  }
}

module.exports = {
  BadRequest,
  NotFound,
  GatewayTimeout
};
