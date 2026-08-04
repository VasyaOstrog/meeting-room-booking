(function (global) {
  let currentDate = new Date();
  let currentView = 'month'; // month, week, day
  let bookings = [];
  let rooms = [];

  const DAYS = ['НД', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const MONTHS = ['СІЧ', 'ЛЮТ', 'БЕР', 'КВІ', 'ТРА', 'ЧЕР', 'ЛИП', 'СЕР', 'ВЕР', 'ЖОВ', 'ЛИС', 'ГРУ'];

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isSameDay(date1, date2) {
    return formatDate(date1) === formatDate(date2);
  }

  function getBookingsForDate(date) {
    const dateStr = formatDate(date);
    return bookings.filter((booking) => {
      const bookingDate = formatDate(new Date(booking.startTime));
      return bookingDate === dateStr;
    });
  }

  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    let html = '<div class="calendar__grid calendar__grid--month">';

    DAYS.forEach((day) => {
      html += `<div class="calendar__day-name">${day}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="calendar__cell calendar__cell--empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = isSameDay(date, today);
      const dayBookings = getBookingsForDate(date);
      const hasActive = dayBookings.some((b) => !b.cancelledAt);
      const hasCancelled = dayBookings.some((b) => b.cancelledAt);

      let cellClass = 'calendar__cell';
      if (isToday) cellClass += ' calendar__cell--today';
      if (hasActive) cellClass += ' calendar__cell--has-bookings';

      html += `<div class="${cellClass}" data-date="${formatDate(date)}">`;
      html += `<div class="calendar__date">${day}</div>`;

      if (dayBookings.length > 0) {
        html += '<div class="calendar__indicators">';
        if (hasActive) {
          html += `<span class="calendar__indicator calendar__indicator--active" title="${dayBookings.filter(b => !b.cancelledAt).length} активних"></span>`;
        }
        if (hasCancelled) {
          html += `<span class="calendar__indicator calendar__indicator--cancelled" title="${dayBookings.filter(b => b.cancelledAt).length} скасованих"></span>`;
        }
        html += '</div>';
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderWeekView() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    let html = '<div class="calendar__week">';

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      const dayBookings = getBookingsForDate(date);
      const isToday = isSameDay(date, new Date());

      html += `<div class="calendar__day ${isToday ? 'calendar__day--today' : ''}" data-date="${formatDate(date)}">`;
      html += `<div class="calendar__day-header">`;
      html += `<span class="calendar__day-name">${DAYS[i]}</span>`;
      html += `<span class="calendar__day-number">${date.getDate()}</span>`;
      html += `</div>`;

      html += '<div class="calendar__day-bookings">';

      if (dayBookings.length === 0) {
        html += '<div class="calendar__no-bookings">Немає бронювань</div>';
      } else {
        dayBookings.forEach((booking) => {
          const room = rooms.find((r) => r.id === booking.roomId);
          const startTime = new Date(booking.startTime);
          const endTime = new Date(booking.endTime);
          const isCancelled = Boolean(booking.cancelledAt);

          html += `<div class="calendar__booking ${isCancelled ? 'calendar__booking--cancelled' : ''}" data-booking-id="${booking.id}">`;
          html += `<div class="calendar__booking-time">${startTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</div>`;
          html += `<div class="calendar__booking-title">${booking.title}</div>`;
          html += `<div class="calendar__booking-room">${room ? room.name : 'Кімната #' + booking.roomId}</div>`;
          html += `</div>`;
        });
      }

      html += '</div>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderDayView() {
    const dayBookings = getBookingsForDate(currentDate);
    const hours = [];

    for (let h = 9; h <= 18; h++) {
      hours.push(h);
    }

    let html = '<div class="calendar__day-view">';
    html += `<div class="calendar__day-header calendar__day-header--single">`;
    html += `<span class="calendar__day-name">${DAYS[currentDate.getDay()]}</span>`;
    html += `<span class="calendar__day-number">${currentDate.getDate()} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}</span>`;
    html += `</div>`;

    html += '<div class="calendar__timeline">';

    hours.forEach((hour) => {
      html += `<div class="calendar__hour">`;
      html += `<div class="calendar__hour-label">${hour}:00</div>`;
      html += `<div class="calendar__hour-slot"></div>`;
      html += `</div>`;
    });

    html += '<div class="calendar__day-bookings-overlay">';
    dayBookings.forEach((booking) => {
      const room = rooms.find((r) => r.id === booking.roomId);
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);
      const isCancelled = Boolean(booking.cancelledAt);

      const startHour = startTime.getHours();
      const startMin = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMin = endTime.getMinutes();

      const startMinutesFromNine = (startHour - 9) * 60 + startMin;
      const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);

      const topPx = startMinutesFromNine; // 1 minute = 1px
      const heightPx = durationMinutes; // Use actual duration, no minimum

      html += `<div class="calendar__booking-block ${isCancelled ? 'calendar__booking-block--cancelled' : ''}"
        data-booking-id="${booking.id}"
        style="top: ${topPx}px; height: ${heightPx}px;">`;
      html += `<div class="calendar__booking-block-time">${startTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</div>`;
      html += `<div class="calendar__booking-block-title">${booking.title}</div>`;
      html += `<div class="calendar__booking-block-room">${room ? room.name : 'Кімната #' + booking.roomId}</div>`;
      html += `</div>`;
    });
    html += '</div>';

    html += '</div>';
    return html;
  }

  function render() {
    const container = document.getElementById('calendar-view');
    if (!container) return;

    const header = document.getElementById('calendar-header');
    const content = document.getElementById('calendar-content');

    if (!header || !content) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = MONTHS[month];

    let headerText = '';
    if (currentView === 'month') {
      headerText = `${monthName} ${year}`;
    } else if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      headerText = `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${MONTHS[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${year}`;
    } else {
      headerText = `${DAYS[currentDate.getDay()]}, ${monthName} ${currentDate.getDate()}, ${year}`;
    }

    header.innerHTML = `
      <div class="calendar__controls">
        <button type="button" id="calendar-prev" class="button button--secondary" style="padding: 0.5rem 1rem;">‹ ПОПЕР</button>
        <h2 class="calendar__title">${headerText}</h2>
        <button type="button" id="calendar-next" class="button button--secondary" style="padding: 0.5rem 1rem;">НАСТ ›</button>
      </div>
      <div class="calendar__view-switcher">
        <button type="button" class="button button--secondary ${currentView === 'month' ? 'button--active' : ''}" data-view="month">МІСЯЦЬ</button>
        <button type="button" class="button button--secondary ${currentView === 'week' ? 'button--active' : ''}" data-view="week">ТИЖДЕНЬ</button>
        <button type="button" class="button button--secondary ${currentView === 'day' ? 'button--active' : ''}" data-view="day">ДЕНЬ</button>
      </div>
    `;

    if (currentView === 'month') {
      content.innerHTML = renderMonthView();
    } else if (currentView === 'week') {
      content.innerHTML = renderWeekView();
    } else {
      content.innerHTML = renderDayView();
    }

    attachEventListeners();
  }

  function attachEventListeners() {
    const prevBtn = document.getElementById('calendar-prev');
    const nextBtn = document.getElementById('calendar-next');

    prevBtn?.addEventListener('click', navigatePrev);
    nextBtn?.addEventListener('click', navigateNext);

    document.querySelectorAll('.calendar__view-switcher button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        if (view) {
          currentView = view;
          render();
        }
      });
    });

    document.querySelectorAll('[data-booking-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const bookingId = Number(e.currentTarget.dataset.bookingId);
        const booking = bookings.find((b) => b.id === bookingId);
        if (booking && global.BookingModals) {
          global.BookingModals.detailsModal.show(
            booking,
            rooms,
            handleEditBooking,
            handleCancelBooking
          );
        }
      });
    });

    document.querySelectorAll('.calendar__cell[data-date]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const dateStr = e.currentTarget.dataset.date;
        if (dateStr) {
          currentDate = new Date(dateStr + 'T12:00:00');
          currentView = 'day';
          render();
        }
      });
    });
  }

  function handleEditBooking(booking) {
    if (global.BookingModals) {
      global.BookingModals.editModal.show(booking, rooms, async () => {
        if (global.loadCalendarData) {
          await global.loadCalendarData();
        }
      });
    }
  }

  function handleCancelBooking(booking) {
    if (global.BookingModals) {
      global.BookingModals.cancelModal.show(booking.id, async () => {
        if (global.loadCalendarData) {
          await global.loadCalendarData();
        }
      });
    }
  }

  function navigatePrev() {
    if (currentView === 'month') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (currentView === 'week') {
      currentDate.setDate(currentDate.getDate() - 7);
    } else {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    render();
  }

  function navigateNext() {
    if (currentView === 'month') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (currentView === 'week') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    render();
  }

  function updateData(newBookings, newRooms) {
    bookings = newBookings || [];
    rooms = newRooms || [];
    console.log('Calendar updateData called:', { bookings: bookings.length, rooms: rooms.length });
    console.log('Bookings data:', bookings);
    render();
  }

  function init() {
    render();
  }

  global.CyberpunkCalendar = {
    init,
    render,
    updateData,
  };
})(window);
