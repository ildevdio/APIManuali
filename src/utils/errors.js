export class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends HttpError {
  constructor(message) {super(message, 404);}
}

export class ConflictError extends HttpError {
  constructor(message) {super(message, 409);}
}

export class BadRequestError extends HttpError {
  constructor(message) {super(message, 400);}
}

export class InternalServerError extends HttpError {
  constructor(message = "Erro interno do servidor") {super(message, 500);}
}

export class ValidationError extends HttpError {
  constructor(errors){
    super('Erro de validação.',400);
    this.errors=errors;
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Não autenticado.') { super(message, 401); }
}