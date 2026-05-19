import express from "express";
import {
  createDiagnosis,
  deleteDiagnosis,
  getDiagnoses,
  updateDiagnosis,
} from "../controllers/diagnosisController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", authorizeRoles("admin", "receptionist", "clinician"), getDiagnoses);
router.post("/", authorizeRoles("admin", "receptionist", "clinician"), createDiagnosis);
router.put("/:id", authorizeRoles("admin", "receptionist", "clinician"), updateDiagnosis);
router.delete("/:id", authorizeRoles("admin", "receptionist"), deleteDiagnosis);

export default router;
