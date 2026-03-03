const express = require('express');
const router = express.Router();

// POST /api/identify
// Validate request and return dummy response
router.post('/', (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // Validation: At least one of email or phoneNumber must be provided
    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: 'At least one of email or phoneNumber is required',
      });
    }

    // Dummy response for now
    const dummyResponse = {
      contact: {
        primaryContactId: null,
        emails: [],
        phoneNumbers: [],
        secondaryContactIds: [],
      },
    };

    res.status(200).json(dummyResponse);
  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
