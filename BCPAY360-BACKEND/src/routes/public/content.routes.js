import express from "express";
import { getPublicContentAll } from "../../controllers/employee/getContent.controller.js";
import { submitPublicSupportTicket } from "../../controllers/public/support.controller.js";

const router = express.Router();

router.get("/content", getPublicContentAll);

// Public support ticket — no auth required (bcpay360.com/support form)
router.post("/support", submitPublicSupportTicket);

export default router;