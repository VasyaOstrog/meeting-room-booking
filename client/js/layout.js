(function (global) {
  function setBackendUrl(url) {
    const el = document.getElementById('backend-url');
    if (el) {
      el.textContent = url || '—';
    }
  }

  function setAdminPanelVisible(isAdmin) {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) {
      return;
    }

    if (isAdmin) {
      adminPanel.classList.remove('hidden');
    } else {
      adminPanel.classList.add('hidden');
    }
  }

  function setBookingAuthWarning(isLoggedIn) {
    const warning = document.getElementById('booking-auth-warning');
    if (warning) {
      warning.hidden = Boolean(isLoggedIn);
    }
  }

  function scrollToBookingPanel() {
    const panel = document.getElementById('booking-panel');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function scrollToAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel && !panel.classList.contains('hidden')) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function ensureActivePageVisible() {
    const active = document.querySelector('.page-page.active');
    if (active) {
      return active.id;
    }

    const schedule = document.getElementById('page-schedule');
    if (schedule) {
      document.querySelectorAll('.page-page').forEach((page) => {
        const isSchedule = page.id === 'page-schedule';
        page.hidden = !isSchedule;
        page.classList.toggle('active', isSchedule);
      });
      return 'page-schedule';
    }

    return null;
  }

  global.AppLayout = {
    setBackendUrl,
    setAdminPanelVisible,
    setBookingAuthWarning,
    scrollToBookingPanel,
    scrollToAdminPanel,
    ensureActivePageVisible,
  };
})(window);
