import express from "express";
import {
  companyAdminPreLogin,
  companyAdminVerifyOtp
} from "../../../controllers/organization/superadmin/companyAdmin.controller.js";

 
const router = express.Router();

/* ADMIN LOGIN */
router.post("/pre-login", companyAdminPreLogin);
router.post("/verify-otp", companyAdminVerifyOtp);



export default router;
