/**
 * Input validation utilities
 */

/**
 * Validate and sanitize email
 * @param {String} email - Email to validate
 * @returns {String|null} - Sanitized email or null if invalid
 */
const validateEmail = (email) => {
  if (!email) return null;

  // Convert to string and trim
  const trimmedEmail = String(email).trim().toLowerCase();

  // Basic email regex validation
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(trimmedEmail) && trimmedEmail.length <= 255) {
    return trimmedEmail;
  }

  return null;
};

/**
 * Validate and sanitize phone number
 * Phone can be string or number, converted to string
 * @param {String|Number} phoneNumber - Phone number to validate
 * @returns {String|null} - Sanitized phone or null if invalid
 */
const validatePhoneNumber = (phoneNumber) => {
  if (phoneNumber === null || phoneNumber === undefined || phoneNumber === '') {
    return null;
  }

  // Convert to string and trim
  const trimmedPhone = String(phoneNumber).trim();

  // Phone must be at least 5 characters, max 20
  // Allow digits, spaces, hyphens, parentheses, plus sign
  if (/^[\d\s\-\+\(\)]{5,20}$/.test(trimmedPhone)) {
    return trimmedPhone;
  }

  return null;
};

/**
 * Validate identify request
 * @param {Object} body - Request body
 * @returns {Object} - { isValid: boolean, email: string|null, phoneNumber: string|null, error: string|null }
 */
const validateIdentifyRequest = (body) => {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      email: null,
      phoneNumber: null,
      error: 'Request body must be a valid JSON object',
    };
  }

  const { email, phoneNumber } = body;

  // Validate email
  const validatedEmail = validateEmail(email);

  // Validate phone
  const validatedPhone = validatePhoneNumber(phoneNumber);

  // At least one must be valid
  if (!validatedEmail && !validatedPhone) {
    return {
      isValid: false,
      email: null,
      phoneNumber: null,
      error:
        'At least one valid email or phoneNumber is required. Email must be valid format. Phone must be 5-20 characters.',
    };
  }

  return {
    isValid: true,
    email: validatedEmail,
    phoneNumber: validatedPhone,
    error: null,
  };
};

module.exports = {
  validateEmail,
  validatePhoneNumber,
  validateIdentifyRequest,
};
