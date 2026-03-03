const express = require('express');
const router = express.Router();
const { identifyContact } = require('../services/identifyService');
const { validateIdentifyRequest } = require('../utils/validation');
const { ValidationError } = require('../utils/errors');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { identifyLimiter } = require('../middleware/rateLimiter');

/**
 * POST /api/identify
 * 
 * Identify and reconcile contacts across multiple purchases
 * 
 * Request Body:
 * {
 *   "email"?: string,
 *   "phoneNumber"?: string
 * }
 * 
 * Response:
 * {
 *   "contact": {
 *     "primaryContatctId": ObjectId,
 *     "emails": string[],
 *     "phoneNumbers": string[],
 *     "secondaryContactIds": ObjectId[]
 *   }
 * }
 * 
 * Handles:
 * - Single contact lookup (by email or phone)
 * - Multiple linked contacts
 * - Cross-group merging
 * - New contact creation
 * - Duplicate detection
 */
router.post(
  '/',
  identifyLimiter,
  asyncHandler(async (req, res) => {
    // Validate and sanitize input
    const validation = validateIdentifyRequest(req.body);

    if (!validation.isValid) {
      throw new ValidationError(validation.error);
    }

    // Use validated and sanitized data
    const { email, phoneNumber } = validation;

    // Delegate orchestration to service layer
    const response = await identifyContact(email, phoneNumber);

    res.status(200).json(response);
  })
);

module.exports = router;
