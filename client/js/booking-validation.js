const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const OFFICE_OPEN_MINUTES = 9 * 60;
const OFFICE_CLOSE_MINUTES = 19 * 60;
const MIN_DURATION_MINUTES = 30;
const MAX_DURATION_MINUTES = 4 * 60;
const MIN_TITLE_LENGTH = 1;
const MAX_TITLE_LENGTH = 100;

function addError(errors, field, message) {
  if (!errors[field]) {
    errors[field] = message;
  }
}

function parseTimeToMinutes(value) {
  const match = TIME_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours * 60 + minutes;
}

function isValidDateValue(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function validateTimeField(value, fieldName, { minMinutes, maxMinutes }) {
  if (!value) {
    return `${fieldName} is required.`;
  }

  if (!TIME_PATTERN.test(value)) {
    return `${fieldName} must use HH:MM format (for example, 09:30).`;
  }

  const totalMinutes = parseTimeToMinutes(value);

  if (totalMinutes === null) {
    return `${fieldName} is not a valid time.`;
  }

  if (totalMinutes % 30 !== 0) {
    return `${fieldName} must use 30-minute slots (for example, 10:00 or 10:30).`;
  }

  if (totalMinutes < minMinutes || totalMinutes > maxMinutes) {
    return `${fieldName} must be within office hours (09:00–19:00).`;
  }

  return null;
}

function validateBookingForm(values) {
  const errors = {};

  if (!values.roomId) {
    addError(errors, 'roomId', 'Please select a room.');
  }

  if (!values.title) {
    addError(errors, 'title', 'Please enter a meeting title.');
  } else if (values.title.length < MIN_TITLE_LENGTH || values.title.length > MAX_TITLE_LENGTH) {
    addError(errors, 'title', `Title must be between ${MIN_TITLE_LENGTH} and ${MAX_TITLE_LENGTH} characters.`);
  }

  if (!values.date) {
    addError(errors, 'date', 'Please select a date.');
  } else if (!isValidDateValue(values.date)) {
    addError(errors, 'date', 'Date must use YYYY-MM-DD format.');
  } else if (values.date < getTodayDateKey()) {
    addError(errors, 'date', 'Date cannot be in the past.');
  }

  const startTimeError = validateTimeField(values.startTime, 'Start time', {
    minMinutes: OFFICE_OPEN_MINUTES,
    maxMinutes: OFFICE_CLOSE_MINUTES - MIN_DURATION_MINUTES,
  });

  if (startTimeError) {
    addError(errors, 'startTime', startTimeError);
  }

  const endTimeError = validateTimeField(values.endTime, 'End time', {
    minMinutes: OFFICE_OPEN_MINUTES + MIN_DURATION_MINUTES,
    maxMinutes: OFFICE_CLOSE_MINUTES,
  });

  if (endTimeError) {
    addError(errors, 'endTime', endTimeError);
  }

  const startMinutes = parseTimeToMinutes(values.startTime);
  const endMinutes = parseTimeToMinutes(values.endTime);

  if (startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes) {
    addError(errors, 'endTime', 'End time must be after start time.');
  }

  if (startMinutes !== null && endMinutes !== null && endMinutes > startMinutes) {
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes < MIN_DURATION_MINUTES) {
      addError(errors, 'endTime', 'Booking must be at least 30 minutes long.');
    } else if (durationMinutes > MAX_DURATION_MINUTES) {
      addError(errors, 'endTime', 'Booking cannot be longer than 4 hours.');
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    summary: Object.values(errors)[0] ?? '',
  };
}

function combineDateAndTimeToIso(dateValue, timeValue) {
  if (!isValidDateValue(dateValue) || !TIME_PATTERN.test(timeValue)) {
    throw new Error('Invalid date or time');
  }

  const localDate = new Date(`${dateValue}T${timeValue}`);

  if (Number.isNaN(localDate.getTime())) {
    throw new Error('Invalid date or time');
  }

  return localDate.toISOString();
}

function buildBookingPayload(values) {
  return {
    roomId: values.roomId,
    title: values.title,
    startTime: combineDateAndTimeToIso(values.date, values.startTime),
    endTime: combineDateAndTimeToIso(values.date, values.endTime),
  };
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
