import express from "express";
import { verifyEmployeeToken } from "../../middlewares/auth.middleware.js";
import {
  checkIn,
  checkOut,
  getMyAttendance
} from "../../controllers/employee/attendance.controller.js";
import { 
  startOvertime, 
  stopOvertime 
} from "../../controllers/employee/overtime.controller.js";

const router = express.Router();

/* PREFLIGHT */
router.options("*", (_, res) => res.sendStatus(200));

/* PROTECTED */


/* ACTIONS */
router.post("/check-in", verifyEmployeeToken, checkIn);
router.post("/check-out", verifyEmployeeToken, checkOut);
router.post("/overtime/start", verifyEmployeeToken, startOvertime);
router.post("/overtime/stop", verifyEmployeeToken, stopOvertime);

/* VIEWS */

router.get("/my", verifyEmployeeToken, getMyAttendance);

/* ✅ SUMMARY */




export default router;
