export class UnauthenticatedError extends Error {
  readonly code = "UNAUTHENTICATED";

  constructor(message = "A verified staff sign-in is required.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN";

  constructor(message = "This staff account does not have permission.") {
    super(message);
    this.name = "ForbiddenError";
  }
}
