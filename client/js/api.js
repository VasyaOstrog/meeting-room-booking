async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
  } catch (error) {
    throw new ApiError(
      'Unable to reach the server. Make sure the backend is running.',
      0,
      error,
    );
  }

  let body = null;

  if (response.status !== 204) {
    const rawBody = await response.text();

    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        if (response.ok) {
          throw new ApiError('Received an invalid response from the server.', response.status);
        }

        throw new ApiError(getDefaultMessageForStatus(response.status), response.status);
      }
    }
  }

  if (!response.ok) {
    const message =
      (body && typeof body.message === 'string' && body.message) ||
      getDefaultMessageForStatus(response.status);

    throw new ApiError(message, response.status);
  }

  return body;
}

function fetchRooms() {
  return apiRequest('/rooms');
}

function fetchBookings() {
  return apiRequest('/bookings');
}

function createBooking(payload) {
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
