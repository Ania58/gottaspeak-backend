import { Router } from "express";
import { contactSupport, adminSendSupportMail } from "./support-mail.controller";

const router = Router();

router.post("/contact", contactSupport);       
router.post("/send", adminSendSupportMail);    

export default router;
