// One "@", no spaces. The dot in the domain is checked separately: a single regex like
// /^[^\s@]+@[^\s@]+\.[^\s@]+$/ backtracks quadratically on long malformed input (ReDoS).
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/;

export const isValidEmail = (email?: string | null) => {
  if (!email || !EMAIL_SHAPE.test(email)) {
    return false;
  }
  // A single trailing dot is the fully-qualified form ("a@b.com."), so drop it
  // before splitting. "a@com." still fails below because it has no TLD label.
  const domain = email.slice(email.indexOf('@') + 1).replace(/\.$/, '');
  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }

  // The last label is the TLD: letters only, at least two of them, or an IDN
  // written in punycode ("a@b.xn--p1ai"). Raw Unicode TLDs are rejected.
  if (!/^(?:[A-Za-z]{2,}|xn--[A-Za-z0-9-]+)$/.test(labels[labels.length - 1])) {
    return false;
  }

  // No empty label (a@b..c), and no label may begin or end with a dash.
  return labels.every(
    label => label.length > 0 && !label.startsWith('-') && !label.endsWith('-'),
  );
};

export const validateSignup = (data: any) => {
  const { accountType, orgName, email, password, country } = data;

  // 2. Organization Specific Validations
  if (accountType === 'Organization') {
    if (!orgName || orgName.trim().length === 0) {
      return 'Organisation name is required';
    }
    if (!country) {
      return "Please select your organisation's country";
    }

    if (!isValidEmail(email)) {
      return 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters';
    }
  } else {
    if (!isValidEmail(email)) {
      return 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters';
    }
  }

  return null; // No errors
};
