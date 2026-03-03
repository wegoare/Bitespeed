import prisma from "../prisma/prismaClient";

export const identifyContact = async (email?: string, phoneNumber?: string) => {

  const matchedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email ?? undefined },
        { phoneNumber: phoneNumber ?? undefined }
      ]
    }
  });

  // CASE 1: No contact exists
  if (matchedContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "primary"
      }
    });

    return formatResponse([newContact]);
  }

  // Get all linked contacts
  const allContactIds = matchedContacts.map(c => c.id);

  const linkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: allContactIds } },
        { linkedId: { in: allContactIds } }
      ]
    }
  });

  const allContacts = [...new Map(
    [...matchedContacts, ...linkedContacts]
      .map(item => [item.id, item])
  ).values()];

  // Find oldest → primary
  allContacts.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const primary = allContacts[0];

  // Convert other primaries to secondary
  for (const contact of allContacts) {
    if (contact.id !== primary.id && contact.linkPrecedence === "primary") {
      await prisma.contact.update({
        where: { id: contact.id },
        data: {
          linkPrecedence: "secondary",
          linkedId: primary.id
        }
      });
    }
  }

  // Check if new info exists
  const emails = allContacts.map(c => c.email);
  const phones = allContacts.map(c => c.phoneNumber);

  if (
    (email && !emails.includes(email)) ||
    (phoneNumber && !phones.includes(phoneNumber))
  ) {
    await prisma.contact.create({
      data: {
        email,
        phoneNumber,
        linkPrecedence: "secondary",
        linkedId: primary.id
      }
    });
  }

  const finalContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primary.id },
        { linkedId: primary.id }
      ]
    }
  });

  return formatResponse(finalContacts);
};

const formatResponse = (contacts: any[]) => {
  const primary = contacts.find(c => c.linkPrecedence === "primary");

  return {
    contact: {
      primaryContatctId: primary.id,
      emails: [...new Set(contacts.map(c => c.email).filter(Boolean))],
      phoneNumbers: [...new Set(contacts.map(c => c.phoneNumber).filter(Boolean))],
      secondaryContactIds: contacts
        .filter(c => c.linkPrecedence === "secondary")
        .map(c => c.id)
    }
  };
};