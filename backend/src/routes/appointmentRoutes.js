import express from "express";
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  getMyAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", authorizeRoles("admin", "receptionist", "clinician"), getAppointments);
router.get("/my", authorizeRoles("clinician"), getMyAppointments);
router.post("/", authorizeRoles("admin", "receptionist", "clinician"), createAppointment);
router.patch("/:id/status", authorizeRoles("admin", "receptionist", "clinician"), updateAppointmentStatus);
router.delete("/:id", authorizeRoles("admin", "receptionist"), deleteAppointment);

export default router;


