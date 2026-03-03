import { Request, Response } from "express";
import { identifyContact } from "../services/identify.service";

export const identify = async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  const result = await identifyContact(email, phoneNumber);
  res.status(200).json(result);
};