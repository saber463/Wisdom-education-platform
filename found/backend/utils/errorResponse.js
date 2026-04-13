class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.success = statusCode < 400 ? true : false;

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ErrorResponse {
  constructor(message = '请求参数错误') {
    super(message, 400);
  }
}

class UnauthorizedError extends ErrorResponse {
  constructor(message = '未授权访问') {
    super(message, 401);
  }
}

class ForbiddenError extends ErrorResponse {
  constructor(message = '禁止访问') {
    super(message, 403);
  }
}

class NotFoundError extends ErrorResponse {
  constructor(message = '请求的资源不存在') {
    super(message, 404);
  }
}

class ConflictError extends ErrorResponse {
  constructor(message = '资源已存在') {
    super(message, 409);
  }
}

class ValidationError extends ErrorResponse {
  constructor(message = '请求参数验证失败') {
    super(message, 422);
  }
}

class TooManyRequestsError extends ErrorResponse {
  constructor(message = '请求过于频繁') {
    super(message, 429);
  }
}

class InternalServerError extends ErrorResponse {
  constructor(message = '服务器内部错误') {
    super(message, 500);
  }
}

class ServiceUnavailableError extends ErrorResponse {
  constructor(message = '服务不可用') {
    super(message, 503);
  }
}

export {
  ErrorResponse,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
};
