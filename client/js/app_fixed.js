let currentUser = null;
let cachedRooms = [];
let roomNamesById = {};
let feedbackTimeoutId = null;

const ROUTES = {
  schedule: '/schedule',
  login: '/login',
  register: '/register',
  myBookings: '/my-bookings',
};

const PAGES = {
  [ROUTES.schedule]: 'page-schedule',
  [ROUTES.login]: 'page-login',
  [ROUTES.register]: 'page-register',
  [ROUTES.myBookings]: 'page-my-bookings',
};

const BOOKING_FIELD_IDS = {
  roomId: 'booking-room',
  title: 'booking-title',
  date: 'booking-date',
  startTime: 'booking-start-time',
  endTime: 'booking-end-time',
};

function getRouteFromLocation() {
  const hash = window.location.hash.replace(/^#/, '');
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';

  if (window.location.protocol === 'file:') {
    return Object.values(ROUTES).includes(hash) ? hash : ROUTES.schedule;
  }

  if (pathname === '/' || pathname === '') {
    return Object.values(ROUTES).includes(hash) ? hash : ROUTES.schedule;
  }

  if (Object.values(ROUTES).includes(pathname)) {
    return pathname;
  }

  return Object.values(ROUTES).includes(hash) ? hash : ROUTES.schedule;
}

function updateBrowserUrl(route, replace = false) {
  const useHash = window.location.protocol === 'file:';
  const url = useHash ? `#${route}` : route;

  if (replace) {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }
}

function getAllowedRoute(route) {
  if (!currentUser && route === ROUTES.myBookings) {
    return ROUTES.login;
  }

  if (currentUser && (route === ROUTES.login || route === ROUTES.register)) {
    return ROUTES.schedule;
  }

  return route;
}

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

function setStatus(elementId, message, state = '') {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.hidden = message === '';
  element.dataset.state = state;

  if (elementId === 'booking-form-status' && feedbackTimeoutId) {
    clearTimeout(feedbackTimeoutId);
    feedbackTimeoutId = null;
  }

  if (elementId === 'booking-form-status' && state === 'success') {
    feedbackTimeoutId = window.setTimeout(() => setStatus('booking-form-status', ''), 5000);
  }
}

function setPanelStatus(elementId, message, state = '') {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.dataset.state = state;
  element.hidden = false;
}

function setSubmitLoading(isLoading) {
  const submitButton = document.getElementById('booking-submit');
  if (!submitButton) return;

  const spinner = submitButton.querySelector('.button__spinner');
  const label = submitButton.querySelector('.button__label');

  submitButton.disabled = isLoading;
  if (spinner) spinner.hidden = !isLoading;
  if (label) label.textContent = isLoading ? 'Creating…' : 'Create booking';
}

function setFieldError(fieldName, message) {
  const inputId = BOOKING_FIELD_IDS[fieldName];
  if (!inputId) return;

  const input = document.getElementById(inputId);
  const errorElement = document.getElementById(`${inputId}-error`);

  if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.hidden = message === '';
  }
}

function clearBookingFormErrors() {
  Object.keys(BOOKING_FIELD_IDS).forEach((fieldName) => setFieldError(fieldName, ''));
}

function showBookingFormErrors(errors) {
  clearBookingFormErrors();
  Object.entries(errors).forEach(([fieldName, message]) => setFieldError(fieldName, message));
}

function ensureArray(value, label) {
  if (!Array.isArray(value)) {
    throw new ApiError(`Received an invalid ${label} list from the server.`, 500);
  }
  return value;
}

function updateBookingFormState() {
  const form = document.getElementById('booking-form');
  const authWarning = document.getElementById('booking-auth-warning');
  const enabled = currentUser !== null;

  if (form) {
    form.querySelectorAll('input, select, button').forEach((element) => {
      element.disabled = !enabled;
    });
  }

  if (authWarning) authWarning.hidden = enabled;
}

function createNavLink(route, label, isActive = false) {
  const item = document.createElement('a');
  item.className = 'main-nav__link';
  if (isActive) item.classList.add('main-nav__link--active');
  item.href = route;
  item.textContent = label;
  item.addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo(route);
  });
  return item;
}

function createUserDropdown(user) {
  const container = document.createElement('div');
  container.className = 'nav-dropdown';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-dropdown__trigger button button--secondary';
  trigger.textContent = user?.name || user?.email || 'Account';
  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    container.classList.toggle('nav-dropdown--open');
  });

  const menu = document.createElement('div');
  menu.className = 'nav-dropdown__menu';

  const logoutButton = document.createElement('button');
  logoutButton.type = 'button';
  logoutButton.className = 'nav-dropdown__item';
  logoutButton.textContent = 'Logout';
  logoutButton.addEventListener('click', () => {
    handleLogout();
    navigateTo(ROUTES.login);
  });

  menu.appendChild(logoutButton);
  container.append(trigger, menu);
  return container;
}

function renderNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const route = getRouteFromLocation();
  navbar.replaceChildren();
  navbar.appendChild(createNavLink(ROUTES.schedule, 'Schedule', route === ROUTES.schedule));

  if (!currentUser) {
    navbar.appendChild(createNavLink(ROUTES.login, 'Login', route === ROUTES.login));
    navbar.appendChild(createNavLink(ROUTES.register, 'Register', route === ROUTES.register));
    return;
  }

  navbar.appendChild(createNavLink(ROUTES.myBookings, 'My Bookings', route === ROUTES.myBookings));

  const bookRoomButton = document.createElement('button');
  bookRoomButton.type = 'button';
  bookRoomButton.className = 'button button--primary nav-cta';
  bookRoomButton.textContent = '+ Book Room';
  bookRoomButton.addEventListener('click', handleBookRoomClick);
  navbar.appendChild(bookRoomButton);

  navbar.appendChild(createUserDropdown(currentUser));
}

function updateActiveNavItem(route) {
  document.querySelectorAll('.main-nav__link').forEach((link) => {
    link.classList.toggle('main-nav__link--active', link.getAttribute('href') === route);
  });
}

function showPage(route) {
  const pageId = PAGES[route] || PAGES[ROUTES.schedule];
  document.querySelectorAll('.page-page').forEach((page) => {
    page.hidden = page.id !== pageId;
    page.classList.toggle('active', page.id === pageId);
  });

  renderNavbar();
  updateActiveNavItem(route);
}

function navigateTo(route, replace = false) {
  const normalized = Object.values(ROUTES).includes(route) ? route : ROUTES.schedule;
  const target = getAllowedRoute(normalized);

  updateBrowserUrl(target, replace);
  showPage(target);

  if (target === ROUTES.schedule) {
    loadData().catch((error) => console.error(error));
  }

  if (target === ROUTES.myBookings) {
    loadMyBookings().catch((error) => {
      console.error(error);
      setPanelStatus('my-bookings-status', getErrorMessage(error), 'error');
    });
  }
}

function handleBookRoomClick() {
  if (!currentUser) {
    navigateTo(ROUTES.login);
    return;
  }

  navigateTo(ROUTES.schedule);
  document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth' });
}

function setAuthenticatedUser(user) {
  currentUser = user;
  const adminPanel = document.getElementById('admin-panel');
  if (adminPanel) adminPanel.classList.toggle('hidden', !user?.isAdmin);
  updateBookingFormState();
  renderNavbar();
}

function setUnauthenticatedUser() {
  currentUser = null;
  const adminPanel = document.getElementById('admin-panel');
  if (adminPanel) adminPanel.classList.add('hidden');
  updateBookingFormState();
  renderNavbar();
}

async function refreshAuthState() {
  const token = window.localStorage.getItem('meeting-room-booking-token');
  if (!token) {
    setUnauthenticatedUser();
    return;
  }

  try {
    const response = await fetchCurrentUser();
    if (response?.user) {
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
  if (!emailInput || !passwordInput || !loginError) return;

  loginError.hidden = true;
  loginError.textContent = '';

  try {
    const response = await login({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });

    if (response?.token) {
      window.localStorage.setItem('meeting-room-booking-token', response.token);
      setAuthenticatedUser(response.user);
      await loadData();
      emailInput.value = '';
      passwordInput.value = '';
      navigateTo(ROUTES.schedule);
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
  if (!nameInput || !emailInput || !passwordInput || !registerError) return;

  registerError.hidden = true;
  registerError.textContent = '';

  try {
    const response = await register({
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
    });

    if (response?.token) {
      window.localStorage.setItem('meeting-room-booking-token', response.token);
      setAuthenticatedUser(response.user);
      await loadData();
      nameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';
      navigateTo(ROUTES.schedule);
    }
  } catch (error) {
    registerError.hidden = false;
    registerError.textContent = getErrorMessage(error);
  }
}

function handleLogout() {
  window.localStorage.removeItem('meeting-room-booking-token');
  setUnauthenticatedUser();
  navigateTo(ROUTES.login);
}

function readBookingFormValues(form) {
  const formData = new FormData(form);
  const roomId = Number(formData.get('roomId'));

  return {
    roomId: Number.isInteger(roomId) && roomId > 0 ? roomId : 0,
    title: String(formData.get('title') ?? '').trim(),
    date: String(formData.get('date') ?? '').trim(),
    startTime: String(formData.get('startTime') ?? '').trim(),
    endTime: String(formData.get('endTime') ?? '').trim(),
  };
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  if (!currentUser) {
    navigateTo(ROUTES.login);
    return;
  }

  const form = event.currentTarget;
  clearBookingFormErrors();
  const values = readBookingFormValues(form);
  const validation = validateBookingForm(values);

  if (!validation.valid) {
    showBookingFormErrors(validation.errors);
    setStatus('booking-form-status', validation.summary, 'error');
    return;
  }

  setSubmitLoading(true);
  setStatus('booking-form-status', 'Creating booking…', 'loading');

  try {
    await createBooking(buildBookingPayload(values));
    setStatus('booking-form-status', 'Booking created successfully.', 'success');
    form.reset();
    populateRoomSelect(cachedRooms);
    initializeBookingFormDefaults();
    await loadData();
  } catch (error) {
    setStatus('booking-form-status', getErrorMessage(error), 'error');
  } finally {
    setSubmitLoading(false);
  }
}

async function handleAdminCreateRoom() {
  const nameInput = document.getElementById('admin-room-name');
  const floorInput = document.getElementById('admin-room-floor');
  const capacityInput = document.getElementById('admin-room-capacity');
  const status = document.getElementById('admin-status');
  if (!nameInput || !floorInput || !capacityInput || !status) return;

  status.hidden = false;
  status.dataset.state = 'loading';
  status.textContent = 'Creating room…';

  try {
    await createRoom({
      name: nameInput.value.trim(),
      floor: Number(floorInput.value),
      capacity: Number(capacityInput.value),
    });

    status.dataset.state = 'success';
    status.textContent = 'Room created successfully.';
    nameInput.value = '';
    floorInput.value = '';
    capacityInput.value = '';
    await loadRooms();
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = getErrorMessage(error);
  }
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
  if (!list) return;
  list.replaceChildren();
  if (rooms.length === 0) {
    renderEmptyState(list, 'No rooms available yet.');
    return;
  }
  rooms.forEach((room) => {
    const item = document.createElement('li');
    item.className = 'card';
    const title = document.createElement('p');
    title.className = 'card__title';
    title.textContent = room.name;
    const meta = document.createElement('p');
    meta.className = 'card__meta';
    meta.textContent = `Floor ${room.floor} · Capacity ${room.capacity}`;
    item.append(title, meta);
    list.appendChild(item);
  });
}

function renderBookings(bookings) {
  const list = document.getElementById('bookings-list');
  if (!list) return;
  list.replaceChildren();
  if (bookings.length === 0) {
    renderEmptyState(list, 'No bookings yet. Create one from the schedule page.');
    return;
  }
  bookings.forEach((booking) => {
    const item = document.createElement('li');
    item.className = 'card';
    const title = document.createElement('p');
    title.className = 'card__title';
    title.textContent = booking.title;
    const roomName = roomNamesById[booking.roomId] || `Room #${booking.roomId}`;
    const meta = document.createElement('p');
    meta.className = 'card__meta';
    meta.textContent = `${roomName} · ${formatDateTime(booking.startTime)} – ${formatDateTime(booking.endTime)}`;
    const author = document.createElement('p');
    author.className = 'card__meta';
    author.textContent = booking.createdBy ? `Booked by ${booking.createdBy}` : 'Booked by unknown user';
    const statusBadge = document.createElement('span');
    statusBadge.className = booking.cancelledAt ? 'badge badge--cancelled' : 'badge badge--active';
    statusBadge.textContent = booking.cancelledAt ? 'Cancelled' : 'Active';
    item.append(title, meta, author, statusBadge);
    list.appendChild(item);
  });
}

function renderMyBookings(bookings) {
  const list = document.getElementById('my-bookings-list');
  if (!list) return;
  list.replaceChildren();
  if (bookings.length === 0) {
    renderEmptyState(list, 'You have no active bookings.');
    return;
  }
  bookings.forEach((booking) => {
    const item = document.createElement('li');
    item.className = 'card';
    const title = document.createElement('p');
    title.className = 'card__title';
    title.textContent = booking.title;
    const roomName = roomNamesById[booking.roomId] || `Room #${booking.roomId}`;
    const meta = document.createElement('p');
    meta.className = 'card__meta';
    meta.textContent = `${roomName} · ${formatDateTime(booking.startTime)} – ${formatDateTime(booking.endTime)}`;
    const row = document.createElement('div');
    row.className = 'card__row';
    const statusBadge = document.createElement('span');
    statusBadge.className = booking.cancelledAt ? 'badge badge--cancelled' : 'badge badge--active';
    statusBadge.textContent = booking.cancelledAt ? 'Cancelled' : 'Active';
    row.appendChild(statusBadge);
    if (!booking.cancelledAt) {
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.className = 'button button--secondary';
      cancelButton.textContent = 'Cancel booking';
      cancelButton.addEventListener('click', () => handleCancelBooking(booking.id));
      row.appendChild(cancelButton);
    }
    item.append(title, meta, row);
    list.appendChild(item);
  });
}

async function handleCancelBooking(bookingId) {
  setPanelStatus('my-bookings-status', 'Cancelling booking…', 'loading');
  try {
    await cancelBooking(bookingId);
    setPanelStatus('my-bookings-status', 'Booking cancelled successfully.', 'success');
    await loadMyBookings();
    await loadBookingsList();
  } catch (error) {
    setPanelStatus('my-bookings-status', getErrorMessage(error), 'error');
  }
}

function populateRoomSelect(rooms) {
  const select = document.getElementById('booking-room');
  if (!select) return;
  const selectedValue = select.value;
  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = rooms.length === 0 ? 'No rooms available' : 'Select a room';
  select.appendChild(placeholder);
  rooms.forEach((room) => {
    const option = document.createElement('option');
    option.value = String(room.id);
    option.textContent = `${room.name} (Floor ${room.floor})`;
    select.appendChild(option);
  });
  if (selectedValue && rooms.some((room) => String(room.id) === selectedValue)) {
    select.value = selectedValue;
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

async function loadMyBookings() {
  setPanelStatus('my-bookings-status', 'Loading your bookings…', 'loading');
  try {
    const bookings = ensureArray(await fetchMyBookings(), 'bookings');
    renderMyBookings(bookings);
    setPanelStatus('my-bookings-status', `${bookings.length} booking(s) loaded`, 'success');
  } catch (error) {
    renderMyBookings([]);
    setPanelStatus('my-bookings-status', getErrorMessage(error), 'error');
  }
}

async function loadData() {
  await Promise.all([loadRooms(), loadBookingsList()]);
}

function initializeBookingFormDefaults() {
  const dateInput = document.getElementById('booking-date');
  if (!dateInput) return;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${year}-${month}-${day}`;
}

function setupBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;
  form.addEventListener('submit', handleBookingSubmit);
  Object.values(BOOKING_FIELD_IDS).forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.addEventListener('input', () => {
      const fieldName = Object.entries(BOOKING_FIELD_IDS).find(([, id]) => id === fieldId)?.[0];
      if (fieldName) setFieldError(fieldName, '');
      setStatus('booking-form-status', '');
    });
  });
}

function setupPageButtons() {
  document.getElementById('book-room-button')?.addEventListener('click', handleBookRoomClick);
  document.getElementById('login-submit')?.addEventListener('click', handleLogin);
  document.getElementById('register-submit')?.addEventListener('click', handleRegister);
  document.getElementById('admin-room-submit')?.addEventListener('click', handleAdminCreateRoom);
  document.getElementById('refresh-bookings')?.addEventListener('click', () => loadBookingsList().catch((error) => console.error(error)));
  document.getElementById('refresh-my-bookings')?.addEventListener('click', () => loadMyBookings().catch((error) => console.error(error)));
}

function closeDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => dropdown.classList.remove('nav-dropdown--open'));
}

window.addEventListener('click', closeDropdowns);
window.addEventListener('popstate', () => navigateTo(getRouteFromLocation(), true));
window.addEventListener('hashchange', () => navigateTo(getRouteFromLocation(), true));
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

document.addEventListener('DOMContentLoaded', async () => {
  setupBookingForm();
  setupPageButtons();
  initializeBookingFormDefaults();
  await refreshAuthState();
  navigateTo(getRouteFromLocation(), true);
});
'''
app_path.write_text(app_code, encoding='utf-8')
api_path.write_text(api_code, encoding='utf-8')
print('app and api rewritten')
PY