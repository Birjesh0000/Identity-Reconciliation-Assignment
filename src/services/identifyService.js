const Contact = require('../models/Contact');
const { DatabaseError } = require('../utils/errors');
const { logger } = require('../utils/logger');

/**
 * Fetch all connected contacts (transitive closure)
 * Finds the complete group of linked contacts by following email/phoneNumber connections
 * 
 * Algorithm:
 * 1. Find initial contacts matching by email OR phoneNumber
 * 2. Use BFS to traverse all linked contacts (both directions)
 * 3. Return complete connected group sorted by createdAt
 */
const fetchConnectedContacts = async (email, phoneNumber) => {
  // Step 1: Find initial matching contacts by email or phoneNumber
  const initialMatches = await Contact.find({
    $or: [
      ...(email ? [{ email: email }] : []),
      ...(phoneNumber ? [{ phoneNumber: phoneNumber }] : []),
    ],
    deletedAt: null,
  });

  // If no initial matches, return empty array
  if (initialMatches.length === 0) {
    return [];
  }

  // Step 2: BFS to find all connected contacts
  const connectedSet = new Set();
  const queue = [...initialMatches];

  while (queue.length > 0) {
    const contact = queue.shift();
    const contactIdStr = contact._id.toString();

    // Skip if already processed
    if (connectedSet.has(contactIdStr)) {
      continue;
    }

    connectedSet.add(contactIdStr);

    // Find all secondary contacts linked TO this contact
    const linkedSecondaries = await Contact.find({
      linkedId: contact._id,
      deletedAt: null,
    });

    for (const secondary of linkedSecondaries) {
      const secondaryIdStr = secondary._id.toString();
      if (!connectedSet.has(secondaryIdStr)) {
        queue.push(secondary);
      }
    }

    // If this contact links TO a primary, fetch that primary
    if (contact.linkedId) {
      const linkedPrimary = await Contact.findById(contact.linkedId);
      if (linkedPrimary && !connectedSet.has(linkedPrimary._id.toString())) {
        queue.push(linkedPrimary);
      }
    }
  }

  // Step 3: Fetch all connected contacts and sort by createdAt (oldest first)
  const allConnected = await Contact.find({
    _id: { $in: Array.from(connectedSet) },
    deletedAt: null,
  }).sort({ createdAt: 1 });

  return allConnected;
};

/**
 * Pure function: Resolve primary contact from a list of connected contacts
 * 
 * Rules:
 * - Oldest contact (by createdAt) becomes primary
 * - All others become secondary
 * - Returns primary contact and secondary contact IDs
 * 
 * @param {Array} contacts - Array of contact objects, should be sorted by createdAt (ascending)
 * @returns {Object} { primary, secondaryContactIds }
 */
const resolvePrimary = (contacts) => {
  // Edge case: empty or single contact
  if (!contacts || contacts.length === 0) {
    return { primary: null, secondaryContactIds: [] };
  }

  if (contacts.length === 1) {
    return {
      primary: contacts[0],
      secondaryContactIds: [],
    };
  }

  // Oldest contact (first in sorted array) is primary
  const primary = contacts[0];
  const secondaryContactIds = contacts
    .slice(1)
    .map((contact) => contact._id);

  return {
    primary,
    secondaryContactIds,
  };
};

/**
 * Consolidate emails and phone numbers from all contacts
 * Primary contact info comes first
 * Pure function - no DB operations
 * 
 * @param {Object} primary - Primary contact object
 * @param {Array} contacts - All contacts in the group
 * @returns {Object} { emails, phoneNumbers } with primary info first
 */
const consolidateContactInfo = (primary, contacts) => {
  const emails = [];
  const phoneNumbers = [];
  const emailSet = new Set();
  const phoneSet = new Set();

  // Add primary contact info first
  if (primary.email && !emailSet.has(primary.email)) {
    emails.push(primary.email);
    emailSet.add(primary.email);
  }
  if (primary.phoneNumber && !phoneSet.has(primary.phoneNumber)) {
    phoneNumbers.push(primary.phoneNumber);
    phoneSet.add(primary.phoneNumber);
  }

  // Add other contacts' info (excluding primary which is already added)
  for (const contact of contacts) {
    if (contact._id.toString() === primary._id.toString()) {
      continue; // Skip primary as already added
    }

    if (contact.email && !emailSet.has(contact.email)) {
      emails.push(contact.email);
      emailSet.add(contact.email);
    }
    if (contact.phoneNumber && !phoneSet.has(contact.phoneNumber)) {
      phoneNumbers.push(contact.phoneNumber);
      phoneSet.add(contact.phoneNumber);
    }
  }

  return { emails, phoneNumbers };
};

/**
 * Check if contact info (email/phone) already exists in the group
 * Pure function
 * 
 * @param {String} email
 * @param {String} phoneNumber
 * @param {Array} contacts - All contacts in the group
 * @returns {Boolean} - true if info is new, false if already exists
 */
const isNewContactInfo = (email, phoneNumber, contacts) => {
  for (const contact of contacts) {
    if (email && contact.email === email) return false;
    if (phoneNumber && contact.phoneNumber === phoneNumber) return false;
  }
  return true;
};

/**
 * Create or link new contact based on existing group
 * Handles:
 * - No contacts exist: create new primary
 * - Contacts exist with new info: create secondary linked to oldest primary
 * - Two primaries in group: newer becomes secondary
 * 
 * @param {String} email
 * @param {String} phoneNumber
 * @param {Array} connectedContacts - Existing connected contacts (sorted by createdAt)
 * @returns {Promise<Object>} - { primary, secondaryContactIds, updatedContacts }
 */
const createOrLinkContact = async (email, phoneNumber, connectedContacts) => {
  // Case 1: No existing contacts - create new primary
  if (connectedContacts.length === 0) {
    const newPrimary = await Contact.create({
      email: email || null,
      phoneNumber: phoneNumber || null,
      linkPrecedence: 'primary',
      linkedId: null,
    });

    return {
      primary: newPrimary,
      secondaryContactIds: [],
      updatedContacts: [newPrimary],
    };
  }

  // Case 2: Contacts exist - resolve primary and check for new info
  const { primary: resolvedPrimary, secondaryContactIds } =
    resolvePrimary(connectedContacts);

  // Check if info is new
  const hasNewInfo = isNewContactInfo(
    email,
    phoneNumber,
    connectedContacts
  );

  // If no new info, return existing group as-is
  if (!hasNewInfo) {
    return {
      primary: resolvedPrimary,
      secondaryContactIds,
      updatedContacts: connectedContacts,
    };
  }

  // Case 3: New info exists - create secondary contact linked to primary
  const newSecondary = await Contact.create({
    email: email || null,
    phoneNumber: phoneNumber || null,
    linkPrecedence: 'secondary',
    linkedId: resolvedPrimary._id,
  });

  // Add new secondary to the list and resort
  const updatedContacts = [...connectedContacts, newSecondary].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  return {
    primary: resolvedPrimary,
    secondaryContactIds: [...secondaryContactIds, newSecondary._id],
    updatedContacts,
  };
};

/**
 * Handle cross-group merging when email and phone match different groups
 * Case: Email matches group A, phone matches group B → merge into one group
 * 
 * The oldest contact across both groups becomes primary
 * All newer contacts and contacts from second group become secondary
 * 
 * @param {Array} contacts - All contacted contacts (may include multiple primaries)
 * @returns {Promise<void>} - Updates database if needed
 */
const mergeContactGroups = async (contacts) => {
  // Find all primary contacts in the group
  const primaries = contacts.filter((c) => c.linkPrecedence === 'primary');

  // Only proceed if there are multiple primaries (separate groups)
  if (primaries.length <= 1) {
    return;
  }

  // Sort primaries by createdAt - oldest wins
  const sortedPrimaries = [...primaries].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  const oldestPrimary = sortedPrimaries[0];

  // Convert all other primaries and their secondaries to link to oldest primary
  for (let i = 1; i < sortedPrimaries.length; i++) {
    const newerPrimary = sortedPrimaries[i];

    // Update the newer primary
    await Contact.findByIdAndUpdate(newerPrimary._id, {
      linkPrecedence: 'secondary',
      linkedId: oldestPrimary._id,
    });

    // Update all secondaries of the newer primary to link to oldest primary
    const secondariesOfNewerPrimary = contacts.filter(
      (c) =>
        c.linkPrecedence === 'secondary' &&
        c.linkedId &&
        c.linkedId.toString() === newerPrimary._id.toString()
    );

    for (const secondary of secondariesOfNewerPrimary) {
      await Contact.findByIdAndUpdate(secondary._id, {
        linkedId: oldestPrimary._id,
      });
    }
  }
};

/**
 * Refetch contacts after database updates
 * Used after operations that modify the database
 * 
 * @param {String} email
 * @param {String} phoneNumber
 * @returns {Promise<Array>} - Fresh contact group
 */
const refetchConnectedContacts = async (email, phoneNumber) => {
  return fetchConnectedContacts(email, phoneNumber);
};

/**
 * Handle multiple primaries in same group (newer becomes secondary to older)
 * Updates database if needed
 * 
 * @param {Array} contacts - All contacts in group
 * @returns {Promise<void>}
 */
const fixMultiplePrimaries = async (contacts) => {
  const primaries = contacts.filter((c) => c.linkPrecedence === 'primary');

  // If more than one primary, make newer ones secondary
  if (primaries.length > 1) {
    // Sort by createdAt - oldest is the true primary
    const oldestPrimary = primaries[0];

    // Update all other primaries to secondary
    for (let i = 1; i < primaries.length; i++) {
      await Contact.findByIdAndUpdate(primaries[i]._id, {
        linkPrecedence: 'secondary',
        linkedId: oldestPrimary._id,
      });
    }
  }
};

/**
 * Build the final response object in exact spec format
 * Pure function - formats data for API response
 * 
 * Response format exactly as required:
 * {
 *   "contact": {
 *     "primaryContatctId": number,  // Note: spec has this typo
 *     "emails": string[],           // First element is primary email
 *     "phoneNumbers": string[],     // First element is primary phone
 *     "secondaryContactIds": number[]
 *   }
 * }
 * 
 * @param {Object} primary - Primary contact
 * @param {Array} emails - All emails (primary first)
 * @param {Array} phoneNumbers - All phone numbers (primary first)
 * @param {Array} allContacts - All contacts in the group
 * @returns {Object} - Response object matching spec exactly
 */
const buildIdentifyResponse = (primary, emails, phoneNumbers, allContacts) => {
  // Get secondary contact IDs (all except primary)
  const secondaryContactIds = allContacts
    .filter((c) => c._id.toString() !== primary._id.toString())
    .map((c) => c._id);

  return {
    contact: {
      primaryContatctId: primary._id, // Exact field name from spec (with typo)
      emails,                          // Primary email first
      phoneNumbers,                    // Primary phone first
      secondaryContactIds,             // All secondary contact IDs
    },
  };
};

/**
 * Main orchestration function for identity reconciliation
 * 
 * Handles the complete flow:
 * 1. Fetch all connected contacts by email/phone
 * 2. Merge separate groups if email and phone match different primaries
 * 3. Fix multiple primaries (newer becomes secondary)
 * 4. Create or link new contact if new info provided
 * 5. Consolidate contact data
 * 6. Build and return response
 * 
 * @param {String} email - Contact email (optional but at least one required)
 * @param {String} phoneNumber - Contact phone (optional but at least one required)
 * @returns {Promise<Object>} - Response object with contact data
 * @throws {Error} - If database operations fail
 */
const identifyContact = async (email, phoneNumber) => {
  try {
    // Step 1: Fetch all connected contacts
    let connectedContacts = await fetchConnectedContacts(email, phoneNumber);

    // Step 2: Handle cross-group merging
    // When email matches one group's primary and phone matches another group's primary
    if (connectedContacts.length > 1) {
      const primaries = connectedContacts.filter(
        (c) => c.linkPrecedence === 'primary'
      );
      if (primaries.length > 1) {
        // Multiple primaries found - merge groups with oldest as primary
        await mergeContactGroups(connectedContacts);
        // Refetch to get merged state
        connectedContacts = await refetchConnectedContacts(email, phoneNumber);
      }
    }

    // Step 3: Handle remaining multiple primaries (safety check)
    await fixMultiplePrimaries(connectedContacts);

    // Step 4: Refetch if updates were made
    if (connectedContacts.length > 0) {
      connectedContacts = await refetchConnectedContacts(email, phoneNumber);
    }

    // Step 5: Create or link contact if new information provided
    const { updatedContacts } = await createOrLinkContact(
      email,
      phoneNumber,
      connectedContacts
    );

    // Step 6: Resolve final primary
    const { primary: finalPrimary } = resolvePrimary(updatedContacts);

    // Step 7: Consolidate emails and phone numbers
    const { emails, phoneNumbers } = consolidateContactInfo(
      finalPrimary,
      updatedContacts
    );

    // Step 8: Build response in exact spec format
    return buildIdentifyResponse(
      finalPrimary,
      emails,
      phoneNumbers,
      updatedContacts
    );
  } catch (error) {
    logger.error('Error in identifyContact service', {
      email,
      phoneNumber,
      errorMessage: error.message,
    });

    // Re-throw if already an AppError
    if (error.name && error.statusCode) {
      throw error;
    }

    // Convert unknown errors to DatabaseError
    throw new DatabaseError(
      'Failed to identify contact. Please try again.',
      error
    );
  }
};

module.exports = {
  fetchConnectedContacts,
  refetchConnectedContacts,
  resolvePrimary,
  consolidateContactInfo,
  isNewContactInfo,
  createOrLinkContact,
  mergeContactGroups,
  fixMultiplePrimaries,
  buildIdentifyResponse,
  identifyContact,
};
