let cachedRooms = [];
let roomNamesById = {};
let feedbackTimeoutId = null;

function formatDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const BOOKING_FIELD_IDS = {
  roomId: 'booking-room',
  userId: 'booking-user-id',
  title: 'booking-title',
  date: 'booking-date',
  startTime: 'booking-start-time',
  endTime: 'booking-end-time',
};

function setStatus(elementId, message, state = '') {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.textContent = message;
  element.hidden = message === '';
  element.dataset.state = state;

  if (elementId === 'booking-form-status' && feedbackTimeoutId) {
    clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = null;
  }

  if (elementId === 'booking-form-status' && state === 'success') {
    feedbackTimeoutId = window.setTimeout(() => {
      setStatus('booking-form-status', '');
    }, 5000);
  }
}

function setPanelStatus(elementId, message, state = '') {
  const element = document.getElementById(elementId);

  if (!element) {
    return;
  }

  element.textContent = message;
  element.dataset.state = state;
  element.hidden = false;
}

function setSubmitLoading(isLoading) {
  const submitButton = document.getElementById('booking-submit');
  const spinner = submitButton?.querySelector('.button__spinner');
  const label = submitButton?.querySelector('.button__label');

  if (!submitButton) {
    return;
  }

  submitButton.disabled = isLoading;

  if (spinner) {
    spinner.hidden = !isLoading;
  }

  if (label) {
    label.textContent = isLoading ? 'Creating…' : 'Create booking';
  }
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

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new ApiError(`Received an invalid ${label} list from the server.`, 500);
  }

  return value;
}

function renderEmptyState(list, message) {
  list.replaceChildren();

  const item = document.createElement('li');
  item.className = 'empty-state';
  item.textContent = message;
  list.appendChild(item);
}

function renderRooms(rooms) {
  const list = document.getElementById('rooms-list');

  if (!list) {
    return;
  }

  list.replaceChildren();

  if (rooms.length === 0) {
    renderEmptyState(list, 'No rooms available yet.');
    return;
  }

  for (const room of rooms) {
    const item = document.createElement('li');
    item.className = 'card';

    const title = document.createElement('p');
    title.className = 'card__title';
    title.textContent = room.name;

    const meta = document.createElement('p');
    meta.className = 'card__meta';
    meta.textContent = `Capacity: ${room.capacity} people`;

    const row = document.createElement('div');
    row.className = 'card__row';

    const floorBadge = document.createElement('span');
    floorBadge.className = 'badge badge--floor';
    floorBadge.textContent = `Floor ${room.floor}`;

    const capacityBadge = document.createElement('span');
    capacityBadge.className = 'badge badge--capacity';
    capacityBadge.textContent = `${room.capacity} seats`;

    row.append(floorBadge, capacityBadge);
    item.append(title, meta, row);
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
    renderEmptyState(list, 'No bookings yet. Create one using the form.');
    return;
  }

  for (const booking of bookings) {
    const item = document.createElement('li');
    item.className = 'card';

    const title = document.createElement('p');
    title.className = 'card__title';
    title.textContent = booking.title;

    const roomName = roomNamesById[booking.roomId] ?? `Room #${booking.roomId}`;
    const meta = document.createElement('p');
    meta.className = 'card__meta';
    meta.textContent = `${roomName} · ${formatDateTime(booking.startTime)} – ${formatDateTime(booking.endTime)}`;

    const row = document.createElement('div');
    row.className = 'card__row';

    const statusBadge = document.createElement('span');
    statusBadge.className = booking.cancelledAt ? 'badge badge--cancelled' : 'badge badge--active';
    statusBadge.textContent = booking.cancelledAt ? 'Cancelled' : 'Active';

    row.appendChild(statusBadge);
    item.append(title, meta, row);
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
  const refreshButton = document.getElementById('refresh-bookings');

  if (refreshButton) {
    refreshButton.disabled = true;
  }

  setPanelStatus('bookings-status', 'Refreshing bookings…', 'loading');

  try {
    const bookings = ensureArray(await fetchBookings(), 'bookings');
    renderBookings(bookings);
    setPanelStatus('bookings-status', `${bookings.length} booking(s) loaded`, 'success');
  } catch (error) {
    renderBookings([]);
    setPanelStatus('bookings-status', getErrorMessage(error), 'error');
    throw error;
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
    }
  }
}

async function loadRooms() {
  setPanelStatus('rooms-status', 'Loading rooms…', 'loading');

  try {
    const rooms = ensureArray(await fetchRooms(), 'rooms');

    cachedRooms = rooms;
    roomNamesById = Object.fromEntries(rooms.map((room) => [room.id, room.name]));

    renderRooms(rooms);
    populateRoomSelect(rooms);
    setPanelStatus('rooms-status', `${rooms.length} room(s) available`, 'success');
  } catch (error) {
    cachedRooms = [];
    roomNamesById = {};

    renderRooms([]);
    populateRoomSelect([]);
    setPanelStatus('rooms-status', getErrorMessage(error), 'error');
  }
}

async function loadBookingsList() {
  setPanelStatus('bookings-status', 'Loading bookings…', 'loading');

  try {
    const bookings = ensureArray(await fetchBookings(), 'bookings');
    renderBookings(bookings);
    setPanelStatus('bookings-status', `${bookings.length} booking(s) loaded`, 'success');
  } catch (error) {
    renderBookings([]);
    setPanelStatus('bookings-status', getErrorMessage(error), 'error');
  }
}

async function loadData() {
  await Promise.all([loadRooms(), loadBookingsList()]);
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

function setupRefreshButton() {
  const refreshButton = document.getElementById('refresh-bookings');

  if (!refreshButton) {
    return;
  }

  refreshButton.addEventListener('click', () => {
    refreshBookings().catch((error) => {
      console.error(error);
    });
  });
}

function setupBookingForm() {
  const form = document.getElementById('booking-form');

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearBookingFormErrors();

    const values = readBookingFormValues(form);
    const validation = validateBookingForm(values);

    if (!validation.valid) {
      showBookingFormErrors(validation.errors);
      setStatus('booking-form-status', validation.summary, 'error');
      return;
    }

    let payload;

    try {
      payload = buildBookingPayload(values);
    } catch {
      setStatus('booking-form-status', 'Please check the date and time values.', 'error');
      return;
    }

    setSubmitLoading(true);
    setStatus('booking-form-status', 'Creating booking…', 'loading');

    try {
      await createBooking(payload);
      clearBookingFormErrors();
      setStatus('booking-form-status', 'Booking created successfully.', 'success');
      form.reset();
      populateRoomSelect(cachedRooms);
      initializeBookingFormDefaults();

      try {
        await refreshBookings();
      } catch {
        setStatus(
          'booking-form-status',
          'Booking created, but the bookings list could not be refreshed.',
          'error',
        );
      }
    } catch (error) {
      setStatus('booking-form-status', getErrorMessage(error), 'error');
    } finally {
      setSubmitLoading(false);
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
  setupRefreshButton();
  initializeBookingFormDefaults();
  loadData().catch((error) => {
    console.error(error);
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
