"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyContact = void 0;
const prismaClient_1 = __importDefault(require("../prisma/prismaClient"));
const identifyContact = async (email, phoneNumber) => {
    const matchedContacts = await prismaClient_1.default.contact.findMany({
        where: {
            OR: [
                { email: email !== null && email !== void 0 ? email : undefined },
                { phoneNumber: phoneNumber !== null && phoneNumber !== void 0 ? phoneNumber : undefined }
            ]
        }
    });
    // CASE 1: No contact exists
    if (matchedContacts.length === 0) {
        const newContact = await prismaClient_1.default.contact.create({
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
    const linkedContacts = await prismaClient_1.default.contact.findMany({
        where: {
            OR: [
                { id: { in: allContactIds } },
                { linkedId: { in: allContactIds } }
            ]
        }
    });
    const allContacts = [...new Map([...matchedContacts, ...linkedContacts]
            .map(item => [item.id, item])).values()];
    // Find oldest → primary
    allContacts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const primary = allContacts[0];
    // Convert other primaries to secondary
    for (const contact of allContacts) {
        if (contact.id !== primary.id && contact.linkPrecedence === "primary") {
            await prismaClient_1.default.contact.update({
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
    if ((email && !emails.includes(email)) ||
        (phoneNumber && !phones.includes(phoneNumber))) {
        await prismaClient_1.default.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: "secondary",
                linkedId: primary.id
            }
        });
    }
    const finalContacts = await prismaClient_1.default.contact.findMany({
        where: {
            OR: [
                { id: primary.id },
                { linkedId: primary.id }
            ]
        }
    });
    return formatResponse(finalContacts);
};
exports.identifyContact = identifyContact;
const formatResponse = (contacts) => {
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
