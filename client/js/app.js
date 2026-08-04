let cachedRooms = [];
let roomNamesById = {};
let feedbackTimeoutId = null;
let currentUser = null;

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
    label.textContent = isLoading ? 'Створення…' : 'Створити бронювання';
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

function getUser() {
  return currentUser;
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
    renderEmptyState(list, 'Кімнати ще не доступні.');
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
    meta.textContent = `Місткість: ${room.capacity} осіб`;

    const row = document.createElement('div');
    row.className = 'card__row';

    const floorBadge = document.createElement('span');
    floorBadge.className = 'badge badge--floor';
    floorBadge.textContent = `Поверх ${room.floor}`;

    const capacityBadge = document.createElement('span');
    capacityBadge.className = 'badge badge--capacity';
    capacityBadge.textContent = `${room.capacity} місць`;

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
    renderEmptyState(list, 'Бронювань ще немає. Створіть його за допомогою форми.');
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
    statusBadge.textContent = booking.cancelledAt ? 'Скасовано' : 'Активне';

    row.appendChild(statusBadge);
    item.append(title, meta, row);
    list.appendChild(item);
  }
}

function renderMyBookings(bookings) {
  const list = document.getElementById('my-bookings-list');

  if (!list) {
    return;
  }

  list.replaceChildren();

  if (bookings.length === 0) {
    renderEmptyState(list, 'У вас ще немає бронювань.');
    return;
  }

  for (const booking of bookings) {
    const item = document.createElement('li');
    item.className = booking.cancelledAt ? 'card card--cancelled' : 'card';

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
    statusBadge.textContent = booking.cancelledAt ? 'СКАСОВАНО' : 'АКТИВНЕ';

    row.appendChild(statusBadge);

    if (!booking.cancelledAt) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'button button--secondary';
      editBtn.style.cssText = 'padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-left: auto;';
      editBtn.textContent = 'РЕДАГУВАТИ';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleEditBooking(booking);
      });

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'button button--danger';
      cancelBtn.style.cssText = 'padding: 0.4rem 0.8rem; font-size: 0.8rem;';
      cancelBtn.textContent = 'СКАСУВАТИ';
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCancelBooking(booking.id);
      });

      row.appendChild(editBtn);
      row.appendChild(cancelBtn);
    }

    item.addEventListener('click', () => {
      handleViewBookingDetails(booking);
    });

    item.append(title, meta, row);
    list.appendChild(item);
  }
}

function updateBookingFormState() {
  const submitButton = document.getElementById('booking-submit');
  const isLoggedIn = currentUser !== null;

  if (submitButton) {
    submitButton.disabled = !isLoggedIn;
  }

  window.AppLayout?.setBookingAuthWarning(isLoggedIn);
}

function setAuthenticatedUser(user) {
  currentUser = user;
  window.AppLayout?.setAdminPanelVisible(user?.isAdmin || false);
  updateBookingFormState();
  window.AppNavbar?.render();
}

function setUnauthenticatedUser() {
  currentUser = null;
  window.AppLayout?.setAdminPanelVisible(false);
  updateBookingFormState();
  window.AppNavbar?.render();
}

async function refreshAuthState() {
  const token = window.localStorage.getItem('meeting-room-booking-token');

  if (!token) {
    setUnauthenticatedUser();
    return;
  }

  try {
    const response = await fetchCurrentUser();

    if (response && response.user) {
      setAuthenticatedUser(response.user);
      return;
    }
  } catch (error) {
    console.warn('Auth refresh failed', error);
  }

  window.localStorage.removeItem('meeting-room-booking-token');
  setUnauthenticatedUser();
}

async function handleLogin() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');

  if (!emailInput || !passwordInput || !loginError) {
    return;
  }

  loginError.hidden = true;
  loginError.textContent = '';

  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const data = await login({ email, password });

    if (data && data.token) {
      window.localStorage.setItem('meeting-room-booking-token', data.token);
      setAuthenticatedUser(data.user);
      await loadData();
      emailInput.value = '';
      passwordInput.value = '';
      window.AppRouter?.navigate(window.AppRouter.ROUTES.schedule);
    }
  } catch (error) {
    loginError.hidden = false;
    loginError.textContent = getErrorMessage(error);
  }
}

async function handleRegister() {
  const nameInput = document.getElementById('register-name');
  const emailInput = document.getElementById('register-email');
  const passwordInput = document.getElementById('register-password');
  const registerError = document.getElementById('register-error');

  if (!nameInput || !emailInput || !passwordInput || !registerError) {
    return;
  }

  registerError.hidden = true;
  registerError.textContent = '';

  try {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const data = await register({ name, email, password });

    if (data && data.token) {
      window.localStorage.setItem('meeting-room-booking-token', data.token);
      setAuthenticatedUser(data.user);
      await loadData();
      nameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';
      window.AppRouter?.navigate(window.AppRouter.ROUTES.schedule);
    }
  } catch (error) {
    registerError.hidden = false;
    registerError.textContent = getErrorMessage(error);
  }
}

async function handleLogout() {
  window.localStorage.removeItem('meeting-room-booking-token');
  setUnauthenticatedUser();
  window.AppNavbar?.closeDropdowns();
  window.AppRouter?.navigate(window.AppRouter.ROUTES.login);
}

async function handleAdminCreateRoom() {
  const nameInput = document.getElementById('admin-room-name');
  const floorInput = document.getElementById('admin-room-floor');
  const capacityInput = document.getElementById('admin-room-capacity');
  const status = document.getElementById('admin-status');

  if (!nameInput || !floorInput || !capacityInput || !status) {
    return;
  }

  status.hidden = false;
  status.dataset.state = 'loading';
  status.textContent = 'Створення кімнати…';

  try {
    const name = nameInput.value.trim();
    const floor = Number(floorInput.value);
    const capacity = Number(capacityInput.value);

    await createRoom({ name, floor, capacity });

    status.dataset.state = 'success';
    status.textContent = 'Кімнату успішно створено.';
    nameInput.value = '';
    floorInput.value = '1';
    capacityInput.value = '10';
    await loadRooms();
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = getErrorMessage(error);
  }
}

function handleBookRoomClick() {
  if (!currentUser) {
    window.AppRouter?.navigate(window.AppRouter.ROUTES.login);
    return;
  }

  window.AppRouter?.navigate(window.AppRouter.ROUTES.schedule);
  window.AppLayout?.scrollToBookingPanel();
}

function handleAddRoomClick() {
  window.AppRouter?.navigate(window.AppRouter.ROUTES.schedule);
  window.AppLayout?.scrollToAdminPanel();
}

function setupAuthForms() {
  const loginSubmit = document.getElementById('login-submit');
  const registerSubmit = document.getElementById('register-submit');
  const adminRoomSubmit = document.getElementById('admin-room-submit');

  loginSubmit?.addEventListener('click', () => handleLogin());
  registerSubmit?.addEventListener('click', () => handleRegister());
  adminRoomSubmit?.addEventListener('click', () => handleAdminCreateRoom());
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
  placeholder.textContent = rooms.length === 0 ? 'Кімнати недоступні' : 'Оберіть кімнату';
  select.appendChild(placeholder);

  for (const room of rooms) {
    const option = document.createElement('option');
    option.value = String(room.id);
    option.textContent = `${room.name} (Поверх ${room.floor})`;
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

  setPanelStatus('bookings-status', 'Оновлення бронювань…', 'loading');

  try {
    const bookings = ensureArray(await fetchBookings(), 'bookings');
    renderBookings(bookings);
    setPanelStatus('bookings-status', `Завантажено бронювань: ${bookings.length}`, 'success');
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
  setPanelStatus('rooms-status', 'Завантаження кімнат…', 'loading');

  try {
    const rooms = ensureArray(await fetchRooms(), 'rooms');

    cachedRooms = rooms;
    roomNamesById = Object.fromEntries(rooms.map((room) => [room.id, room.name]));

    renderRooms(rooms);
    populateRoomSelect(rooms);
    setPanelStatus('rooms-status', `Доступно кімнат: ${rooms.length}`, 'success');
  } catch (error) {
    cachedRooms = [];
    roomNamesById = {};

    renderRooms([]);
    populateRoomSelect([]);
    setPanelStatus('rooms-status', getErrorMessage(error), 'error');
  }
}

async function loadBookingsList() {
  setPanelStatus('bookings-status', 'Завантаження бронювань…', 'loading');

  try {
    const bookings = ensureArray(await fetchBookings(), 'bookings');
    renderBookings(bookings);
    setPanelStatus('bookings-status', `Завантажено бронювань: ${bookings.length}`, 'success');
  } catch (error) {
    renderBookings([]);
    setPanelStatus('bookings-status', getErrorMessage(error), 'error');
  }
}

async function loadData() {
  await Promise.all([loadRooms(), loadBookingsList()]);
}

async function loadMyBookings() {
  const refreshButton = document.getElementById('refresh-my-bookings');

  if (refreshButton) {
    refreshButton.disabled = true;
  }

  setPanelStatus('my-bookings-status', 'Завантаження ваших бронювань…', 'loading');

  try {
    const bookings = ensureArray(await fetchMyBookings(), 'bookings');
    renderMyBookings(bookings);
    setPanelStatus('my-bookings-status', `Знайдено бронювань: ${bookings.length}`, 'success');
  } catch (error) {
    renderMyBookings([]);
    setPanelStatus('my-bookings-status', getErrorMessage(error), 'error');
  } finally {
    if (refreshButton) {
      refreshButton.disabled = false;
    }
  }
}

function handleViewBookingDetails(booking) {
  if (window.BookingModals) {
    window.BookingModals.detailsModal.show(
      booking,
      cachedRooms,
      handleEditBooking,
      (b) => handleCancelBooking(b.id)
    );
  }
}

function handleEditBooking(booking) {
  if (window.BookingModals) {
    window.BookingModals.editModal.show(booking, cachedRooms, async (updated) => {
      await loadMyBookings();
      if (window.AppRouter?.getCurrentRoute() === window.AppRouter?.ROUTES.schedule) {
        await loadData();
      }
    });
  }
}

function handleCancelBooking(bookingId) {
  if (window.BookingModals) {
    window.BookingModals.cancelModal.show(bookingId, async () => {
      await loadMyBookings();
      if (window.AppRouter?.getCurrentRoute() === window.AppRouter?.ROUTES.schedule) {
        await loadData();
      }
    });
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

function setupMyBookingsRefresh() {
  const refreshButton = document.getElementById('refresh-my-bookings');

  if (!refreshButton) {
    return;
  }

  refreshButton.addEventListener('click', () => {
    loadMyBookings().catch((error) => {
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
      setStatus('booking-form-status', 'Будь ласка, перевірте значення дати та часу.', 'error');
      return;
    }

    setSubmitLoading(true);
    setStatus('booking-form-status', 'Створення бронювання…', 'loading');

    try {
      await createBooking(payload);
      clearBookingFormErrors();
      setStatus('booking-form-status', 'Бронювання успішно створено.', 'success');
      form.reset();
      populateRoomSelect(cachedRooms);
      initializeBookingFormDefaults();

      try {
        await refreshBookings();
      } catch {
        setStatus(
          'booking-form-status',
          'Бронювання створено, але список не вдалося оновити.',
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

function handleRouteChange(route) {
  if (route === window.AppRouter.ROUTES.schedule) {
    loadData().catch((error) => console.error(error));
  }

  if (route === window.AppRouter.ROUTES.myBookings) {
    loadMyBookings().catch((error) => {
      console.error(error);
      setPanelStatus('my-bookings-status', getErrorMessage(error), 'error');
    });
  }

  if (route === window.AppRouter.ROUTES.calendar) {
    loadCalendarData().catch((error) => {
      console.error(error);
    });
  }

  if (route === window.AppRouter.ROUTES.profile) {
    if (window.ProfileManager && window.ProfileManager.loadUserProfile) {
      window.ProfileManager.loadUserProfile().catch((error) => {
        console.error(error);
      });
    }
  }
}

async function loadCalendarData() {
  try {
    const [bookingsData, roomsData] = await Promise.all([
      fetchBookings(),
      fetchRooms(),
    ]);

    const bookings = ensureArray(bookingsData, 'bookings');
    const rooms = ensureArray(roomsData, 'rooms');

    if (window.CyberpunkCalendar) {
      window.CyberpunkCalendar.updateData(bookings, rooms);
    }
  } catch (error) {
    console.error('Failed to load calendar data:', error);
  }
}

window.loadCalendarData = loadCalendarData;

document.addEventListener('DOMContentLoaded', () => {
  const backendUrl = document.getElementById('backend-url');

  if (backendUrl) {
    backendUrl.textContent = API_BASE_URL;
  }

  if (window.AppRouter) {
    window.AppRouter.start();
    window.AppRouter.onChange(handleRouteChange);
  }

  if (window.AppNavbar) {
    window.AppNavbar.init({
      getUser,
      onLogout: handleLogout,
      onBookRoom: handleBookRoomClick,
      onAddRoom: handleAddRoomClick,
    });
  }

  if (window.BookingModals) {
    window.BookingModals.init();
  }

  if (window.CyberpunkCalendar) {
    window.CyberpunkCalendar.init();
  }

  setupBookingForm();
  setupRefreshButton();
  setupMyBookingsRefresh();
  setupAuthForms();
  initializeBookingFormDefaults();
  updateBookingFormState();

  refreshAuthState().then(() => {
    const currentRoute = window.AppRouter?.getCurrentRoute();

    if (currentRoute === window.AppRouter?.ROUTES.calendar) {
      loadCalendarData().catch((error) => {
        console.error(error);
      });
    } else if (currentRoute === window.AppRouter?.ROUTES.myBookings) {
      loadMyBookings().catch((error) => {
        console.error(error);
      });
    } else {
      loadData().catch((error) => {
        console.error(error);
      });
    }
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
