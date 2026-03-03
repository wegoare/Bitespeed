"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const identify_controllers_1 = require("../controllers/identify.controllers");
const prismaClient_1 = __importDefault(require("../prisma/prismaClient"));
const router = express_1.default.Router();
router.post("/identify", identify_controllers_1.identify);
router.get("/contacts", async (req, res) => {
    try {
        const contacts = await prismaClient_1.default.contact.findMany({
            orderBy: {
                createdAt: "asc"
            }
        });
        res.status(200).json(contacts);
    }
    catch (error) {
        console.error("DATABASE ERROR:", error); // 👈 ADD THIS
        res.status(500).json({
            message: "Error fetching contacts",
            error: error.message // 👈 ADD THIS
        });
    }
});
exports.default = router;
