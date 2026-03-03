const express = require('express');
const router = express.Router();
const { identifyContact } = require('../services/identifyService');
const { validateIdentifyRequest } = require('../utils/validation');

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
router.post('/', async (req, res) => {
  try {
    // Validate and sanitize input
    const validation = validateIdentifyRequest(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error,
      });
    }

    // Use validated and sanitized data
    const { email, phoneNumber } = validation;

    // Delegate orchestration to service layer
    const response = await identifyContact(email, phoneNumber);

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in POST /api/identify:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
