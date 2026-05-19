import express from "express";
import {
  createDoctor,
  deleteDoctor,
  getDoctors,
  updateDoctor,
} from "../controllers/doctorController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", authorizeRoles("admin", "receptionist", "clinician"), getDoctors);
router.post("/", authorizeRoles("admin"), createDoctor);
router.put("/:id", authorizeRoles("admin"), updateDoctor);
router.delete("/:id", authorizeRoles("admin"), deleteDoctor);

export default router;
