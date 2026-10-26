// Form checks that mirror the backend's request validation, so mistakes are caught before submitting.
// Each check returns an error message, or '' when the value is valid.

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function checkEmail(value, label = 'Email') {
  return EMAIL_PATTERN.test(value.trim()) ? '' : `${label} must be a valid email address.`;
}

export function checkPassword(value, label = 'Password') {
  if (value.length < 8) return `${label} must be at least 8 characters.`;
  if (value.length > 72) return `${label} must be at most 72 characters.`;
  return '';
}

export function checkNin(value, label = 'NIN') {
  return /^\d{11}$/.test(value) ? '' : `${label} must be exactly 11 digits.`;
}

export function checkAccountNumber(value, label = 'Account number') {
  return /^\d{10}$/.test(value) ? '' : `${label} must be exactly 10 digits.`;
}

export function checkAmount(value, label = 'Amount') {
  if (!(Number(value) > 0)) return `${label} must be greater than zero.`;
  if (!/^\d+(\.\d{1,2})?$/.test(String(value).trim()))
    return `${label} can have at most 2 decimal places.`;
  return '';
}

// Returns the first failing check's message, or ''
export function firstError(...messages) {
  return messages.find(Boolean) || '';
}

// Turns a failed submit into a readable message. Backend validation failures carry a map of
// field -> problem; `labels` maps those field names to the labels shown on the form.
export function submitErrorMessage(err, labels, fallback) {
  const fields = err.response?.data?.data;
  if (
    err.response?.status === 400 &&
    fields &&
    typeof fields === 'object' &&
    !Array.isArray(fields)
  ) {
    const problems = Object.entries(fields).map(
      ([field, problem]) => `${labels[field] || field} ${problem}.`,
    );
    if (problems.length) return problems.join(' ');
  }
  return err.response?.data?.message || fallback;
}
