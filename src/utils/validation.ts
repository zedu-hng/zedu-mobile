const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email?: string | null) =>
  !!email && EMAIL_REGEX.test(email);

export const validateSignup = (data: any) => {
  const { accountType, orgName, email, password, country } = data;

  // 2. Organization Specific Validations
  if (accountType === 'Organization') {
    if (!orgName || orgName.trim().length === 0) {
      return 'Organization name is required';
    }
    if (!country) {
      return "Please select your organization's country";
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
