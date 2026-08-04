const ProfileManager = (function() {
  let profileData = null;

  function showMessage(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stateClass = type === 'success' ? 'success' : 'error';
    container.innerHTML = `
      <div class="feedback-message" data-state="${stateClass}">
        ${message}
      </div>
    `;

    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }

  async function loadUserProfile() {
    try {
      const response = await window.apiCall('/profile');
      if (response.user) {
        profileData = response.user;
        populateProfileForm(profileData);
      }
    } catch (error) {
      showMessage('profile-message', error.message || 'Не вдалося завантажити профіль');
    }
  }

  function populateProfileForm(user) {
    const usernameInput = document.getElementById('profile-username');
    const emailInput = document.getElementById('profile-email');

    if (usernameInput) usernameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
  }

  function initProfile() {
    const updateProfileForm = document.getElementById('update-profile-form');
    const changePasswordForm = document.getElementById('change-password-form');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    if (updateProfileForm) {
      updateProfileForm.addEventListener('submit', handleUpdateProfile);
    }

    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', handleChangePassword);
    }

    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
  }

  async function handleUpdateProfile(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const originalText = btnText.textContent;

    const username = document.getElementById('profile-username').value.trim();
    const email = document.getElementById('profile-email').value.trim();

    submitBtn.disabled = true;
    btnText.textContent = 'Оновлення...';

    try {
      const response = await window.apiCall('/profile', {
        method: 'PATCH',
        body: { name: username, email: email },
      });

      if (response.user) {
        profileData = response.user;
        showMessage('profile-message', 'Профіль успішно оновлено', 'success');
      }
    } catch (error) {
      showMessage('profile-message', error.message || 'Не вдалося оновити профіль');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = originalText;
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnText = submitBtn.querySelector('span');
    const originalText = btnText.textContent;

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      showMessage('password-message', 'Нові паролі не збігаються');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('password-message', 'Новий пароль має містити щонайменше 6 символів');
      return;
    }

    submitBtn.disabled = true;
    btnText.textContent = 'Зміна...';

    try {
      await window.apiCall('/profile/password', {
        method: 'POST',
        body: { currentPassword, newPassword, confirmPassword },
      });

      showMessage('password-message', 'Пароль успішно змінено', 'success');
      form.reset();
    } catch (error) {
      showMessage('password-message', error.message || 'Не вдалося змінити пароль');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = originalText;
    }
  }

  async function handleDeleteAccount() {
    const confirmed = confirm(
      'Ви впевнені, що хочете видалити свій обліковий запис? Цю дію неможливо скасувати. Усі ваші бронювання будуть скасовані, а дані назавжди видалені.'
    );

    if (!confirmed) return;

    const doubleConfirmed = confirm(
      'Це ваш останній шанс. Ви абсолютно впевнені, що хочете назавжди видалити свій обліковий запис?'
    );

    if (!doubleConfirmed) return;

    const deleteBtn = document.getElementById('delete-account-btn');
    const btnText = deleteBtn.querySelector('span');
    const originalText = btnText.textContent;

    deleteBtn.disabled = true;
    btnText.textContent = 'Видалення...';

    try {
      await window.apiCall('/profile', {
        method: 'DELETE',
      });

      showMessage('delete-message', 'Обліковий запис успішно видалено. Перенаправлення...', 'success');

      setTimeout(() => {
        if (window.clearAuth) {
          window.clearAuth();
        }
        window.location.hash = '#/login';
      }, 2000);
    } catch (error) {
      showMessage('delete-message', error.message || 'Не вдалося видалити обліковий запис');
      deleteBtn.disabled = false;
      btnText.textContent = originalText;
    }
  }

  return {
    loadUserProfile,
    initProfile,
  };
})();

window.ProfileManager = ProfileManager;

document.addEventListener('DOMContentLoaded', () => {
  ProfileManager.initProfile();
});
