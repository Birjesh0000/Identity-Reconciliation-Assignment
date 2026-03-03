const Contact = require('../models/Contact');

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

module.exports = {
  fetchConnectedContacts,
};
