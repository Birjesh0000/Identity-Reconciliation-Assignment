const express = require('express');
const router = express.Router();
const { identifyContact } = require('../services/identifyService');

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
    const { email, phoneNumber } = req.body;

    // Validation: At least one of email or phoneNumber must be provided
    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: 'At least one of email or phoneNumber is required',
      });
    }

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
