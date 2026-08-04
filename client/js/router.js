(function (global) {
  const ROUTES = {
    schedule: '/schedule',
    login: '/login',
    register: '/register',
    myBookings: '/my-bookings',
    calendar: '/calendar',
    profile: '/profile',
  };

  const PAGE_IDS = {
    [ROUTES.schedule]: 'page-schedule',
    [ROUTES.login]: 'page-login',
    [ROUTES.register]: 'page-register',
    [ROUTES.myBookings]: 'page-my-bookings',
    [ROUTES.calendar]: 'page-calendar',
    [ROUTES.profile]: 'page-profile',
  };

  const listeners = new Set();

  function normalizeRoute(value) {
    if (!value) {
      return ROUTES.schedule;
    }

    let route = String(value).trim();
    if (route.startsWith('#')) {
      route = route.slice(1);
    }
    if (!route.startsWith('/')) {
      route = `/${route}`;
    }
    route = route.replace(/\/+$/, '') || '/';

    if (route === '/' || route === '') {
      return ROUTES.schedule;
    }

    return Object.values(ROUTES).includes(route) ? route : ROUTES.schedule;
  }

  function getCurrentRoute() {
    const raw = window.location.hash.replace(/^#/, '');
    return normalizeRoute(raw || ROUTES.schedule);
  }

  function getPageId(route) {
    return PAGE_IDS[normalizeRoute(route)] || PAGE_IDS[ROUTES.schedule];
  }

  function showPage(route) {
    const target = normalizeRoute(route);
    const pageId = getPageId(target);

    document.querySelectorAll('.page-page').forEach((page) => {
      const isActive = page.id === pageId;
      page.hidden = !isActive;
      page.classList.toggle('active', isActive);
    });

    return target;
  }

  function navigate(route, options = {}) {
    const { replace = false, force = false } = options;
    const target = normalizeRoute(route);
    const nextHash = `#${target}`;
    const currentHash = window.location.hash || '';

    if (!force && currentHash === nextHash) {
      const active = showPage(target);
      notify(active);
      return active;
    }

    if (replace) {
      window.history.replaceState(null, '', nextHash);
    } else {
      window.history.pushState(null, '', nextHash);
    }

    const active = showPage(target);
    notify(active);
    return active;
  }

  function onChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }

    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  function notify(route) {
    listeners.forEach((callback) => {
      try {
        callback(route);
      } catch (error) {
        console.error('Router listener error:', error);
      }
    });
  }

  function handleLocationChange() {
    const route = getCurrentRoute();
    showPage(route);
    notify(route);
  }

  function start() {
    if (!window.location.hash || window.location.hash === '#') {
      window.history.replaceState(null, '', `#${ROUTES.schedule}`);
    }

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
  }

  global.AppRouter = {
    ROUTES,
    PAGE_IDS,
    normalizeRoute,
    getCurrentRoute,
    getPageId,
    showPage,
    navigate,
    onChange,
    start,
  };
})(window);
