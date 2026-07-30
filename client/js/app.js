let cachedRooms = [];
let roomNamesById = {};

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

function combineDateAndTimeToIso(dateValue, timeValue) {
  const localDate = new Date(`${dateValue}T${timeValue}`);

  if (Number.isNaN(localDate.getTime())) {
    throw new Error('Invalid date or time');
  }

  return localDate.toISOString();
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

function renderBookings(bookings) {
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

function populateRoomSelect(rooms) {
  const select = document.getElementById('booking-room');

  if (!select) {
    return;
  }

  const selectedValue = select.value;

  select.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = rooms.length === 0 ? 'No rooms available' : 'Select a room';
  select.appendChild(placeholder);

  for (const room of rooms) {
    const option = document.createElement('option');
    option.value = String(room.id);
    option.textContent = `${room.name} (Floor ${room.floor})`;
    select.appendChild(option);
  }

  if (selectedValue && rooms.some((room) => String(room.id) === selectedValue)) {
    select.value = selectedValue;
  }

  select.disabled = rooms.length === 0;
}

async function refreshBookings() {
  const bookings = await fetchBookings();
  renderBookings(bookings);
}

async function loadData() {
  setStatus('rooms-status', 'Loading rooms…');
  setStatus('bookings-status', 'Loading bookings…');

  try {
    const [rooms, bookings] = await Promise.all([fetchRooms(), fetchBookings()]);

    cachedRooms = rooms;
    roomNamesById = Object.fromEntries(rooms.map((room) => [room.id, room.name]));

    renderRooms(rooms);
    renderBookings(bookings);
    populateRoomSelect(rooms);

    setStatus('rooms-status', '');
    setStatus('bookings-status', '');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load data';

    cachedRooms = [];
    roomNamesById = {};

    renderRooms([]);
    renderBookings([]);
    populateRoomSelect([]);

    setStatus('rooms-status', message, true);
    setStatus('bookings-status', message, true);
  }
}

function initializeBookingFormDefaults() {
  const dateInput = document.getElementById('booking-date');

  if (!dateInput) {
    return;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  dateInput.min = `${year}-${month}-${day}`;
}

function setupBookingForm() {
  const form = document.getElementById('booking-form');
  const submitButton = document.getElementById('booking-submit');

  if (!form || !submitButton) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const roomId = Number(formData.get('roomId'));
    const userId = Number(formData.get('userId'));
    const title = String(formData.get('title') ?? '').trim();
    const date = String(formData.get('date') ?? '');
    const startTime = String(formData.get('startTime') ?? '');
    const endTime = String(formData.get('endTime') ?? '');

    if (!roomId || !userId || !title || !date || !startTime || !endTime) {
      setStatus('booking-form-status', 'Please fill in all fields.', true);
      return;
    }

    let payload;

    try {
      payload = {
        roomId,
        userId,
        title,
        startTime: combineDateAndTimeToIso(date, startTime),
        endTime: combineDateAndTimeToIso(date, endTime),
      };
    } catch {
      setStatus('booking-form-status', 'Invalid date or time.', true);
      return;
    }

    submitButton.disabled = true;
    setStatus('booking-form-status', 'Creating booking…');

    try {
      await createBooking(payload);
      setStatus('booking-form-status', 'Booking created successfully.');
      form.reset();
      populateRoomSelect(cachedRooms);
      await refreshBookings();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      setStatus('booking-form-status', message, true);
    } finally {
      submitButton.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const backendUrl = document.getElementById('backend-url');

  if (backendUrl) {
    backendUrl.textContent = API_BASE_URL;
  }

  setupBookingForm();
  initializeBookingFormDefaults();
  loadData();
});
