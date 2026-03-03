const express = require('express');
const router = express.Router();
const {
  fetchConnectedContacts,
  resolvePrimary,
  consolidateContactInfo,
  createOrLinkContact,
  fixMultiplePrimaries,
} = require('../services/identifyService');

// POST /api/identify
// Handle contact identification and linking
router.post('/', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // Validation: At least one of email or phoneNumber must be provided
    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: 'At least one of email or phoneNumber is required',
      });
    }

    // Step 1: Fetch all connected contacts
    const connectedContacts = await fetchConnectedContacts(email, phoneNumber);

    // Step 2: Handle multiple primaries (newer becomes secondary)
    await fixMultiplePrimaries(connectedContacts);

    // Step 3: Create or link contact, or return existing group
    const {
      primary,
      secondaryContactIds,
      updatedContacts,
    } = await createOrLinkContact(email, phoneNumber, connectedContacts);

    // Step 4: Resolve primary from updated contacts
    const { primary: finalPrimary } = resolvePrimary(updatedContacts);

    // Step 5: Consolidate emails and phone numbers
    const { emails, phoneNumbers } = consolidateContactInfo(
      finalPrimary,
      updatedContacts
    );

    // Step 6: Return formatted response
    const response = {
      contact: {
        primaryContactId: finalPrimary._id,
        emails,
        phoneNumbers,
        secondaryContactIds: updatedContacts
          .filter((c) => c._id.toString() !== finalPrimary._id.toString())
          .map((c) => c._id),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
