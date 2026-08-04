(function (global) {
  let currentBookingId = null;
  let onCancelSuccess = null;
  let onEditSuccess = null;

  const cancelModal = {
    show(bookingId, onSuccess) {
      currentBookingId = bookingId;
      onCancelSuccess = onSuccess;

      const modal = document.getElementById('cancel-modal');
      const reason = document.getElementById('cancel-reason');
      const status = document.getElementById('cancel-modal-status');

      if (reason) reason.value = '';
      if (status) status.hidden = true;
      if (modal) modal.hidden = false;
    },

    hide() {
      const modal = document.getElementById('cancel-modal');
      if (modal) modal.hidden = true;
      currentBookingId = null;
      onCancelSuccess = null;
    },

    async confirm() {
      const reason = document.getElementById('cancel-reason')?.value || '';
      const status = document.getElementById('cancel-modal-status');
      const confirmBtn = document.getElementById('cancel-modal-confirm');

      if (!currentBookingId) return;

      try {
        if (confirmBtn) confirmBtn.disabled = true;

        const result = await cancelBooking(currentBookingId, reason);

        if (status) {
          status.textContent = 'Бронювання успішно скасовано!';
          status.dataset.state = 'success';
          status.hidden = false;
        }

        setTimeout(() => {
          cancelModal.hide();
          if (onCancelSuccess) onCancelSuccess(result);
        }, 1000);
      } catch (error) {
        if (status) {
          status.textContent = getErrorMessage(error);
          status.dataset.state = 'error';
          status.hidden = false;
        }
      } finally {
        if (confirmBtn) confirmBtn.disabled = false;
      }
    },
  };

  const editModal = {
    show(booking, rooms, onSuccess) {
      currentBookingId = booking.id;
      onEditSuccess = onSuccess;

      const modal = document.getElementById('edit-modal');
      const roomSelect = document.getElementById('edit-room');
      const titleInput = document.getElementById('edit-title');
      const dateInput = document.getElementById('edit-date');
      const startInput = document.getElementById('edit-start-time');
      const endInput = document.getElementById('edit-end-time');
      const status = document.getElementById('edit-modal-status');

      if (roomSelect) {
        roomSelect.replaceChildren();
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Оберіть кімнату';
        roomSelect.appendChild(placeholder);

        rooms.forEach((room) => {
          const option = document.createElement('option');
          option.value = String(room.id);
          option.textContent = `${room.name} (Поверх ${room.floor})`;
          roomSelect.appendChild(option);
        });

        roomSelect.value = String(booking.roomId);
      }

      if (titleInput) titleInput.value = booking.title;

      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);

      if (dateInput) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        dateInput.min = todayStr;
      }

      if (startInput) {
        const hours = String(startDate.getHours()).padStart(2, '0');
        const mins = String(startDate.getMinutes()).padStart(2, '0');
        startInput.value = `${hours}:${mins}`;
      }

      if (endInput) {
        const hours = String(endDate.getHours()).padStart(2, '0');
        const mins = String(endDate.getMinutes()).padStart(2, '0');
        endInput.value = `${hours}:${mins}`;
      }

      if (status) status.hidden = true;
      if (modal) modal.hidden = false;
    },

    hide() {
      const modal = document.getElementById('edit-modal');
      if (modal) modal.hidden = true;
      currentBookingId = null;
      onEditSuccess = null;
    },

    async submit(event) {
      event.preventDefault();

      const roomSelect = document.getElementById('edit-room');
      const titleInput = document.getElementById('edit-title');
      const dateInput = document.getElementById('edit-date');
      const startInput = document.getElementById('edit-start-time');
      const endInput = document.getElementById('edit-end-time');
      const status = document.getElementById('edit-modal-status');
      const submitBtn = event.target.querySelector('button[type="submit"]');

      if (!currentBookingId) return;

      try {
        if (submitBtn) submitBtn.disabled = true;

        const roomId = Number(roomSelect?.value);
        const title = titleInput?.value.trim();
        const date = dateInput?.value;
        const startTime = startInput?.value;
        const endTime = endInput?.value;

        if (!roomId || !title || !date || !startTime || !endTime) {
          throw new Error('Будь ласка, заповніть усі поля');
        }

        const startLocal = new Date(`${date}T${startTime}`);
        const endLocal = new Date(`${date}T${endTime}`);

        if (isNaN(startLocal.getTime()) || isNaN(endLocal.getTime())) {
          throw new Error('Невірний формат дати або часу');
        }

        const payload = {
          roomId,
          title,
          startTime: startLocal.toISOString(),
          endTime: endLocal.toISOString(),
        };

        const result = await updateBooking(currentBookingId, payload);

        if (status) {
          status.textContent = 'Бронювання успішно оновлено!';
          status.dataset.state = 'success';
          status.hidden = false;
        }

        setTimeout(() => {
          editModal.hide();
          if (onEditSuccess) onEditSuccess(result);
        }, 1000);
      } catch (error) {
        if (status) {
          status.textContent = getErrorMessage(error);
          status.dataset.state = 'error';
          status.hidden = false;
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    },
  };

  const detailsModal = {
    show(booking, rooms, onEdit, onCancel) {
      const modal = document.getElementById('details-modal');
      const content = document.getElementById('details-content');
      const editBtn = document.getElementById('details-modal-edit');
      const cancelBtn = document.getElementById('details-modal-cancel');
      const closeBtn = document.getElementById('details-modal-close');

      if (!content) return;

      const room = rooms.find((r) => r.id === booking.roomId);
      const startDate = new Date(booking.startTime);
      const endDate = new Date(booking.endTime);

      const isCancelled = Boolean(booking.cancelledAt);

      content.innerHTML = `
        <div style="display: grid; gap: 1rem;">
          <div>
            <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em;">Назва</p>
            <p style="color: var(--text-primary); font-size: 1.1rem; font-weight: 600; margin-top: 0.25rem;">${booking.title}</p>
          </div>

          <div>
            <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em;">Кімната</p>
            <p style="color: var(--text-primary); font-size: 1.1rem; font-weight: 600; margin-top: 0.25rem;">
              ${room ? room.name : `Кімната #${booking.roomId}`}
              ${room ? `<span style="color: var(--text-secondary); font-size: 0.9rem;"> · Поверх ${room.floor}</span>` : ''}
            </p>
          </div>

          <div>
            <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em;">Дата і час</p>
            <p style="color: var(--text-primary); font-size: 1.1rem; font-weight: 600; margin-top: 0.25rem;">
              ${startDate.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 0.25rem;">
              ${startDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })} –
              ${endDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div>
            <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em;">Створив</p>
            <p style="color: var(--text-primary); font-size: 1.1rem; font-weight: 600; margin-top: 0.25rem;">${booking.createdBy || 'Невідомо'}</p>
          </div>

          <div>
            <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em;">Статус</p>
            <p style="margin-top: 0.5rem;">
              <span class="badge ${isCancelled ? 'badge--cancelled' : 'badge--active'}">
                ${isCancelled ? 'СКАСОВАНО' : 'АКТИВНЕ'}
              </span>
            </p>
          </div>

          ${isCancelled ? `
            <div>
              <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em;">Скасовано</p>
              <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 0.25rem;">
                ${new Date(booking.cancelledAt).toLocaleString('uk-UA')}
              </p>
            </div>
          ` : ''}
        </div>
      `;

      if (editBtn) {
        editBtn.hidden = isCancelled;
        editBtn.onclick = () => {
          detailsModal.hide();
          if (onEdit) onEdit(booking);
        };
      }

      if (cancelBtn) {
        cancelBtn.hidden = isCancelled;
        cancelBtn.onclick = () => {
          detailsModal.hide();
          if (onCancel) onCancel(booking);
        };
      }

      if (closeBtn) {
        closeBtn.onclick = () => {
          detailsModal.hide();
        };
      }

      if (modal) modal.hidden = false;
    },

    hide() {
      const modal = document.getElementById('details-modal');
      if (modal) modal.hidden = true;
    },
  };

  function init() {
    const cancelModalCancel = document.getElementById('cancel-modal-cancel');
    const cancelModalConfirm = document.getElementById('cancel-modal-confirm');

    cancelModalCancel?.addEventListener('click', () => cancelModal.hide());
    cancelModalConfirm?.addEventListener('click', () => cancelModal.confirm());

    const editModalCancel = document.getElementById('edit-modal-cancel');
    const editForm = document.getElementById('edit-booking-form');

    editModalCancel?.addEventListener('click', () => editModal.hide());
    editForm?.addEventListener('submit', (e) => editModal.submit(e));

    const detailsModalClose = document.getElementById('details-modal-close');
    detailsModalClose?.addEventListener('click', () => detailsModal.hide());

    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.hidden = true;
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        cancelModal.hide();
        editModal.hide();
        detailsModal.hide();
      }
    });
  }

  global.BookingModals = {
    init,
    cancelModal,
    editModal,
    detailsModal,
  };
})(window);
