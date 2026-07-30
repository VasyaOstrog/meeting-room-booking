function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function setStatus(elementId, message, isError = false) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.textContent = message;
  element.hidden = message === '';
  element.dataset.state = isError ? 'error' : 'info';
}

function renderRooms(rooms) {
  const list = document.getElementById('rooms-list');

  if (!list) {
    return;
  }

  list.replaceChildren();

  if (rooms.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'No rooms available.';
    list.appendChild(item);
    return;
  }

  for (const room of rooms) {
    const item = document.createElement('li');
    item.textContent = `${room.name} — Floor ${room.floor}, capacity ${room.capacity}`;
    list.appendChild(item);
  }
}

function renderBookings(bookings, roomNamesById) {
  const list = document.getElementById('bookings-list');

  if (!list) {
    return;
  }

  list.replaceChildren();

  if (bookings.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'No bookings yet.';
    list.appendChild(item);
    return;
  }

  for (const booking of bookings) {
    const item = document.createElement('li');
    const roomName = roomNamesById[booking.roomId] ?? `Room #${booking.roomId}`;
    const status = booking.cancelledAt ? ' (cancelled)' : '';

    item.textContent =
      `${booking.title} — ${roomName}, ${formatDateTime(booking.startTime)} to ${formatDateTime(booking.endTime)}${status}`;

    list.appendChild(item);
  }
}

async function loadData() {
  setStatus('rooms-status', 'Loading rooms…');
  setStatus('bookings-status', 'Loading bookings…');

  try {
    const [rooms, bookings] = await Promise.all([fetchRooms(), fetchBookings()]);
    const roomNamesById = Object.fromEntries(rooms.map((room) => [room.id, room.name]));

    renderRooms(rooms);
    renderBookings(bookings, roomNamesById);

    setStatus('rooms-status', '');
    setStatus('bookings-status', '');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load data';

    renderRooms([]);
    renderBookings([], {});

    setStatus('rooms-status', message, true);
    setStatus('bookings-status', message, true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const backendUrl = document.getElementById('backend-url');

  if (backendUrl) {
    backendUrl.textContent = API_BASE_URL;
  }

  loadData();
});
