let cachedRooms = [];
let roomNamesById = {};

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

const BOOKING_FIELD_IDS = {
  roomId: 'booking-room',
  userId: 'booking-user-id',
  title: 'booking-title',
  date: 'booking-date',
  startTime: 'booking-start-time',
  endTime: 'booking-end-time',
};

function setStatus(elementId, message, isError = false) {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.textContent = message;
  element.hidden = message === '';
  element.dataset.state = isError ? 'error' : 'info';
}

function setFieldError(fieldName, message) {
  const inputId = BOOKING_FIELD_IDS[fieldName];
  const input = inputId ? document.getElementById(inputId) : null;
  const errorElement = document.getElementById(`${inputId}-error`);

  if (input) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.hidden = message === '';
  }
}

function clearBookingFormErrors() {
  for (const fieldName of Object.keys(BOOKING_FIELD_IDS)) {
    setFieldError(fieldName, '');
  }
}

function showBookingFormErrors(errors) {
  clearBookingFormErrors();

  for (const [fieldName, message] of Object.entries(errors)) {
    setFieldError(fieldName, message);
  }
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
    clearBookingFormErrors();

    const values = readBookingFormValues(form);
    const validation = validateBookingForm(values);

    if (!validation.valid) {
      showBookingFormErrors(validation.errors);
      setStatus('booking-form-status', validation.summary, true);
      return;
    }

    let payload;

    try {
      payload = buildBookingPayload(values);
    } catch {
      setStatus('booking-form-status', 'Please check the date and time values.', true);
      return;
    }

    submitButton.disabled = true;
    setStatus('booking-form-status', 'Creating booking…');

    try {
      await createBooking(payload);
      clearBookingFormErrors();
      setStatus('booking-form-status', 'Booking created successfully.');
      form.reset();
      populateRoomSelect(cachedRooms);
      initializeBookingFormDefaults();
      await refreshBookings();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create booking';
      setStatus('booking-form-status', message, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  for (const inputId of Object.values(BOOKING_FIELD_IDS)) {
    const input = document.getElementById(inputId);

    if (!input) {
      continue;
    }

    input.addEventListener('input', clearFieldError);
    input.addEventListener('change', clearFieldError);
  }

  function clearFieldError(event) {
    const inputId = event.target.id;
    const fieldName = Object.entries(BOOKING_FIELD_IDS).find(([, id]) => id === inputId)?.[0];

    if (fieldName) {
      setFieldError(fieldName, '');
    }

    setStatus('booking-form-status', '');
  }
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
