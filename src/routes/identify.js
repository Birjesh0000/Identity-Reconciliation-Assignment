const express = require('express');
const router = express.Router();
const {
  fetchConnectedContacts,
  refetchConnectedContacts,
  resolvePrimary,
  consolidateContactInfo,
  createOrLinkContact,
  mergeContactGroups,
  fixMultiplePrimaries,
  buildIdentifyResponse,
} = require('../services/identifyService');

// POST /api/identify
// Handle contact identification and linking
// Edge cases:
// - Cross-group merging (email matches one group, phone matches another)
// - Exact duplicates (no new info)
// - Only email or only phone
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
    // This handles Case 3 & 4 (only phone or only email)
    let connectedContacts = await fetchConnectedContacts(email, phoneNumber);

    // Step 2: Handle cross-group merging (Case 1)
    // If email matches one group and phone matches another, merge them
    if (connectedContacts.length > 1) {
      const primaries = connectedContacts.filter(
        (c) => c.linkPrecedence === 'primary'
      );
      if (primaries.length > 1) {
        // Multiple primaries found - merge groups with oldest as primary
        await mergeContactGroups(connectedContacts);
        // Refetch to get merged state
        connectedContacts = await refetchConnectedContacts(
          email,
          phoneNumber
        );
      }
    }

    // Step 3: Handle multiple primaries (shouldn't happen after merge, but safety check)
    await fixMultiplePrimaries(connectedContacts);

    // Step 4: Refetch in case fixMultiplePrimaries made updates
    if (connectedContacts.length > 0) {
      connectedContacts = await refetchConnectedContacts(email, phoneNumber);
    }

    // Step 5: Create or link contact, or return existing group (Case 2: duplicates)
    const {
      primary,
      secondaryContactIds,
      updatedContacts,
    } = await createOrLinkContact(email, phoneNumber, connectedContacts);

    // Step 6: Resolve primary from updated contacts
    const { primary: finalPrimary } = resolvePrimary(updatedContacts);

    // Step 7: Consolidate emails and phone numbers
    const { emails, phoneNumbers } = consolidateContactInfo(
      finalPrimary,
      updatedContacts
    );

    // Step 8: Build response in exact spec format
    const response = buildIdentifyResponse(
      finalPrimary,
      emails,
      phoneNumbers,
      updatedContacts
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
