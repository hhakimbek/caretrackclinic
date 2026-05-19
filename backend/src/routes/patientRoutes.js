import express from "express";
import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatients,
  updatePatient,
} from "../controllers/patientController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", authorizeRoles("admin", "receptionist", "clinician"), getPatients);
router.get("/:id", authorizeRoles("admin", "receptionist", "clinician"), getPatientById);
router.post("/", authorizeRoles("admin", "receptionist"), createPatient);
router.put("/:id", authorizeRoles("admin", "receptionist", "clinician"), updatePatient);
router.delete("/:id", authorizeRoles("admin"), deletePatient);

export default router;

