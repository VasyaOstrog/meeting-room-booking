class ApiError extends Error {
  constructor(message, status = 0, cause = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.cause = cause;
  }
}

const STATUS_MESSAGES = {
  400: 'Please check your input and try again.',
  404: 'The requested resource was not found.',
  409: 'This time slot is no longer available.',
  500: 'The server encountered an error. Please try again later.',
  503: 'The service is temporarily unavailable.',
};

function getDefaultMessageForStatus(status) {
  return STATUS_MESSAGES[status] ?? `Request failed (${status}).`;
}

function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
