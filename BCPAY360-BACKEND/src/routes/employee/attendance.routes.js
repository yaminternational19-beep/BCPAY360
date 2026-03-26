import express from "express";
import { verifyEmployeeToken } from "../../middlewares/auth.middleware.js";
import {
  checkIn,
  checkOut,
  getMyAttendance,
} from "../../controllers/employee/attendance.controller.js";

const router = express.Router();

/* PREFLIGHT */
router.options("*", (_, res) => res.sendStatus(200));

/* PROTECTED */


/* ACTIONS */
router.post("/check-in", verifyEmployeeToken, checkIn);
router.post("/check-out", verifyEmployeeToken, checkOut);

/* VIEWS */

router.get("/my", verifyEmployeeToken, getMyAttendance);

/* ✅ SUMMARY */




export default router;
