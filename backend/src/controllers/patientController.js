import { v4 as uuidv4 } from "uuid";
import { doctors, patients } from "../data/db.js";

export function getPatients(req, res) {
  return res.status(200).json(patients);
}

export function getPatientById(req, res) {
  const patient = patients.find((item) => item.id === req.params.id);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  return res.status(200).json(patient);
}

export function createPatient(req, res) {
  const { fullName, phone, dateOfBirth, gender, doctorId = null } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({ message: "fullName and phone are required" });
  }

  if (doctorId) {
    const doctor = doctors.find((item) => item.id === doctorId);
    if (!doctor) {
      return res.status(400).json({ message: "doctorId is invalid" });
    }
  }

  const newPatient = {
    id: uuidv4(),
    fullName,
    phone,
    dateOfBirth: dateOfBirth || null,
    gender: gender || null,
    doctorId,
    createdAt: new Date().toISOString(),
  };

  patients.push(newPatient);
  return res.status(201).json(newPatient);
}

export function updatePatient(req, res) {
  const patient = patients.find((item) => item.id === req.params.id);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  const { fullName, phone, dateOfBirth, gender, doctorId } = req.body;

  if (doctorId !== undefined && doctorId !== null) {
    const doctor = doctors.find((item) => item.id === doctorId);
    if (!doctor) {
      return res.status(400).json({ message: "doctorId is invalid" });
    }
  }

  if (fullName !== undefined) patient.fullName = fullName;
  if (phone !== undefined) patient.phone = phone;
  if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
  if (gender !== undefined) patient.gender = gender;
  if (doctorId !== undefined) patient.doctorId = doctorId;

  return res.status(200).json(patient);
}

export function deletePatient(req, res) {
  const index = patients.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Patient not found" });
  }

  patients.splice(index, 1);
  return res.status(200).json({ message: "Patient deleted" });
}
