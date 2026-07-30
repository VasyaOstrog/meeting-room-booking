async function apiRequest(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const body = await response.json();
      if (body.message) {
        message = body.message;
      }
    } catch {
      // Response body is not JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

function fetchRooms() {
  return apiRequest('/rooms');
}

function fetchBookings() {
  return apiRequest('/bookings');
}
