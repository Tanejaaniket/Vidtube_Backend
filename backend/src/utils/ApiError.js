export default class ApiError extends Error {
  constructor(statusCode, message, err = [], data = null) {
    super(message)
    this.statusCode = statusCode;
    this.message = message;
    this.err = err;
    this.data = data;
    this.sucess = false
  }
}
