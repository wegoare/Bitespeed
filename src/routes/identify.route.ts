import express from "express";
import { identify } from "../controllers/identify.controllers";
import prisma from "../prisma/prismaClient";

const router = express.Router();
router.post("/identify", identify);

router.get("/contacts", async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: {
        createdAt: "asc"
      }
    });

    res.status(200).json(contacts);
  } catch (error: any) {
    console.error("DATABASE ERROR:", error);   // 👈 ADD THIS
    res.status(500).json({
      message: "Error fetching contacts",
      error: error.message                     // 👈 ADD THIS
    });
  }
});

export default router;