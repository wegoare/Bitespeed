"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identify = void 0;
const identify_service_1 = require("../services/identify.service");
const identify = async (req, res) => {
    const { email, phoneNumber } = req.body;
    const result = await (0, identify_service_1.identifyContact)(email, phoneNumber);
    res.status(200).json(result);
};
exports.identify = identify;
