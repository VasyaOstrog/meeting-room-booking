(function (global) {
  let getUser = () => null;
  let onLogout = () => {};
  let onBookRoom = () => {};
  let onAddRoom = () => {};
  let started = false;
  let mobileMenuOpen = false;

  function createLink(route, label, isActive) {
    const link = document.createElement('a');
    link.className = 'main-nav__link';
    if (isActive) {
      link.classList.add('main-nav__link--active');
    }
    link.href = `#${route}`;
    link.dataset.route = route;
    link.textContent = label;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      global.AppRouter.navigate(route);
    });
    return link;
  }

  function createUserDropdown(user) {
    const container = document.createElement('div');
    container.className = 'nav-dropdown';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nav-dropdown__trigger button button--secondary';
    trigger.textContent = user?.name || user?.email || 'Акаунт';
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = container.classList.toggle('nav-dropdown--open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    const menu = document.createElement('div');
    menu.className = 'nav-dropdown__menu';
    menu.setAttribute('role', 'menu');

    const profileButton = document.createElement('button');
    profileButton.type = 'button';
    profileButton.className = 'nav-dropdown__item';
    profileButton.textContent = 'Профіль';
    profileButton.setAttribute('role', 'menuitem');
    profileButton.addEventListener('click', () => {
      container.classList.remove('nav-dropdown--open');
      window.location.hash = '#/profile';
    });

    const logoutButton = document.createElement('button');
    logoutButton.type = 'button';
    logoutButton.className = 'nav-dropdown__item';
    logoutButton.textContent = 'Вийти';
    logoutButton.setAttribute('role', 'menuitem');
    logoutButton.addEventListener('click', () => {
      container.classList.remove('nav-dropdown--open');
      onLogout();
    });

    menu.appendChild(profileButton);
    menu.appendChild(logoutButton);
    container.append(trigger, menu);
    return container;
  }

  function closeDropdowns() {
    document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
      dropdown.classList.remove('nav-dropdown--open');
      const trigger = dropdown.querySelector('.nav-dropdown__trigger');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    const navbar = document.getElementById('navbar');
    const toggleButton = navbar?.querySelector('.nav-mobile-toggle');

    if (navbar) {
      navbar.classList.toggle('mobile-menu-open', mobileMenuOpen);
      document.body.classList.toggle('mobile-menu-open', mobileMenuOpen);
    }

    if (toggleButton) {
      toggleButton.classList.toggle('active', mobileMenuOpen);
      toggleButton.setAttribute('aria-expanded', mobileMenuOpen ? 'true' : 'false');
      toggleButton.setAttribute('aria-label', mobileMenuOpen ? 'Закрити меню' : 'Відкрити меню');
    }
  }

  function closeMobileMenu() {
    if (mobileMenuOpen) {
      mobileMenuOpen = false;
      const navbar = document.getElementById('navbar');
      const toggleButton = navbar?.querySelector('.nav-mobile-toggle');

      if (navbar) {
        navbar.classList.remove('mobile-menu-open');
        document.body.classList.remove('mobile-menu-open');
      }

      if (toggleButton) {
        toggleButton.classList.remove('active');
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.setAttribute('aria-label', 'Відкрити меню');
      }
    }
  }

  function createMobileToggle() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-mobile-toggle';
    button.setAttribute('aria-label', 'Відкрити меню');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'nav-links');

    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      button.appendChild(span);
    }

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleMobileMenu();
    });

    return button;
  }

  function render() {
    const navbar = document.getElementById('navbar');
    if (!navbar || !global.AppRouter) {
      return;
    }

    const { ROUTES, getCurrentRoute } = global.AppRouter;
    const route = getCurrentRoute();
    const user = typeof getUser === 'function' ? getUser() : null;

    navbar.replaceChildren();

    const brand = document.createElement('a');
    brand.className = 'main-nav__brand';
    brand.href = `#${ROUTES.schedule}`;
    brand.textContent = 'MRB';
    brand.addEventListener('click', (event) => {
      event.preventDefault();
      closeMobileMenu();
      global.AppRouter.navigate(ROUTES.schedule);
    });
    navbar.appendChild(brand);

    const linksContainer = document.createElement('div');
    linksContainer.className = 'main-nav__links';
    linksContainer.id = 'nav-links';

    const scheduleLink = createLink(ROUTES.schedule, 'Розклад', route === ROUTES.schedule);
    scheduleLink.addEventListener('click', () => closeMobileMenu());
    linksContainer.appendChild(scheduleLink);

    if (!user) {
      const loginLink = createLink(ROUTES.login, 'Вхід', route === ROUTES.login);
      loginLink.addEventListener('click', () => closeMobileMenu());
      linksContainer.appendChild(loginLink);

      const registerLink = createLink(ROUTES.register, 'Реєстрація', route === ROUTES.register);
      registerLink.addEventListener('click', () => closeMobileMenu());
      linksContainer.appendChild(registerLink);

      navbar.appendChild(linksContainer);
      navbar.appendChild(createMobileToggle());
      return;
    }

    const calendarLink = createLink(ROUTES.calendar, 'Календар', route === ROUTES.calendar);
    calendarLink.addEventListener('click', () => closeMobileMenu());
    linksContainer.appendChild(calendarLink);

    const myBookingsLink = createLink(ROUTES.myBookings, 'Бронювання', route === ROUTES.myBookings);
    myBookingsLink.addEventListener('click', () => closeMobileMenu());
    linksContainer.appendChild(myBookingsLink);

    const spacer = document.createElement('div');
    spacer.className = 'main-nav__spacer';
    linksContainer.appendChild(spacer);

    const bookRoomButton = document.createElement('button');
    bookRoomButton.type = 'button';
    bookRoomButton.className = 'button button--primary nav-cta';
    bookRoomButton.textContent = 'Забронювати кімнату';
    bookRoomButton.addEventListener('click', () => {
      closeMobileMenu();
      onBookRoom();
    });
    linksContainer.appendChild(bookRoomButton);

    if (user.isAdmin) {
      const addRoomButton = document.createElement('button');
      addRoomButton.type = 'button';
      addRoomButton.className = 'button button--secondary nav-cta';
      addRoomButton.textContent = 'Додати кімнату';
      addRoomButton.addEventListener('click', () => {
        closeMobileMenu();
        onAddRoom();
      });
      linksContainer.appendChild(addRoomButton);
    }

    linksContainer.appendChild(createUserDropdown(user));
    navbar.appendChild(linksContainer);
    navbar.appendChild(createMobileToggle());
  }

  function updateActive(route) {
    const target = global.AppRouter?.normalizeRoute(route) || route;
    document.querySelectorAll('.main-nav__link').forEach((link) => {
      const linkRoute = link.dataset.route || link.getAttribute('href')?.replace(/^#/, '');
      link.classList.toggle('main-nav__link--active', linkRoute === target);
    });
  }

  function init(options = {}) {
    getUser = options.getUser || getUser;
    onLogout = options.onLogout || onLogout;
    onBookRoom = options.onBookRoom || onBookRoom;
    onAddRoom = options.onAddRoom || onAddRoom;

    if (!started) {
      window.addEventListener('click', (event) => {
        if (!event.target.closest('.nav-dropdown')) {
          closeDropdowns();
        }
      });

      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closeMobileMenu();
          closeDropdowns();
        }
      });

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (window.innerWidth > 768 && mobileMenuOpen) {
            closeMobileMenu();
          }
        }, 250);
      });

      if (global.AppRouter) {
        global.AppRouter.onChange((route) => {
          closeMobileMenu();
          render();
          updateActive(route);
        });
      }
      started = true;
    }

    render();
  }

  global.AppNavbar = {
    init,
    render,
    updateActive,
    closeDropdowns,
    closeMobileMenu,
    toggleMobileMenu,
  };
})(window);
