function getStoredAuthToken() {
  return window.localStorage.getItem('meeting-room-booking-token');
}

async function apiRequest(path, options = {}) {
  let response;
  const token = getStoredAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers,
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

function fetchBookingById(bookingId) {
  return apiRequest(`/bookings/${bookingId}`);
}

function createBooking(payload) {
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function updateBooking(bookingId, payload) {
  return apiRequest(`/bookings/${bookingId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

function cancelBooking(bookingId, reason) {
  return apiRequest(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

function login(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function register(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function fetchCurrentUser() {
  return apiRequest('/auth/me');
}

function createRoom(payload) {
  return apiRequest('/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function fetchMyBookings() {
  return apiRequest('/bookings/my');
}
