import { v4 as uuidv4 } from "uuid";
import { diagnoses, doctors, patients } from "../data/db.js";

export function getDiagnoses(req, res) {
  return res.status(200).json(diagnoses);
}

export function createDiagnosis(req, res) {
  const { patientId, doctorId, diagnosisName, icdCode, severity, notes } = req.body;

  if (!patientId || !doctorId || !diagnosisName) {
    return res.status(400).json({ message: "patientId, doctorId, diagnosisName are required" });
  }

  const patient = patients.find((x) => x.id === patientId);
  if (!patient) return res.status(404).json({ message: "Patient not found" });

  const doctor = doctors.find((x) => x.id === doctorId);
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  const item = {
    id: uuidv4(),
    patientId,
    doctorId,
    diagnosisName,
    icdCode: icdCode || "",
    severity: severity || "Low",
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };

  diagnoses.push(item);
  return res.status(201).json(item);
}

export function updateDiagnosis(req, res) {
  const item = diagnoses.find((x) => x.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Diagnosis not found" });

  const { diagnosisName, icdCode, severity, notes, doctorId } = req.body;

  if (doctorId !== undefined && doctorId !== null) {
    const doctor = doctors.find((x) => x.id === doctorId);
    if (!doctor) return res.status(400).json({ message: "doctorId is invalid" });
  }

  if (diagnosisName !== undefined) item.diagnosisName = diagnosisName;
  if (icdCode !== undefined) item.icdCode = icdCode;
  if (severity !== undefined) item.severity = severity;
  if (notes !== undefined) item.notes = notes;
  if (doctorId !== undefined) item.doctorId = doctorId;

  return res.status(200).json(item);
}

export function deleteDiagnosis(req, res) {
  const idx = diagnoses.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Diagnosis not found" });
  diagnoses.splice(idx, 1);
  return res.status(200).json({ message: "Diagnosis deleted" });
}
