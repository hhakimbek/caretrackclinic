import { v4 as uuidv4 } from "uuid";
import { doctors, users } from "../data/db.js";

export function getDoctors(req, res) {
  return res.status(200).json(doctors);
}

export function createDoctor(req, res) {
  const { fullName, specialty, phone, userId, status = "Active" } = req.body;

  if (!fullName || !specialty) {
    return res.status(400).json({ message: "fullName and specialty are required" });
  }

  if (userId) {
    const clinicianUser = users.find((item) => item.id === userId && item.role === "clinician");
    if (!clinicianUser) {
      return res.status(400).json({ message: "userId must belong to a clinician user" });
    }
  }

  const newDoctor = {
    id: uuidv4(),
    fullName,
    specialty,
    phone: phone || null,
    status,
    userId: userId || null,
    createdAt: new Date().toISOString(),
  };

  doctors.push(newDoctor);
  return res.status(201).json(newDoctor);
}

export function updateDoctor(req, res) {
  const doctor = doctors.find((item) => item.id === req.params.id);

  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const { fullName, specialty, phone, userId, status } = req.body;

  if (userId !== undefined && userId !== null) {
    const clinicianUser = users.find((item) => item.id === userId && item.role === "clinician");
    if (!clinicianUser) {
      return res.status(400).json({ message: "userId must belong to a clinician user" });
    }
  }

  if (fullName !== undefined) doctor.fullName = fullName;
  if (specialty !== undefined) doctor.specialty = specialty;
  if (phone !== undefined) doctor.phone = phone;
  if (status !== undefined) doctor.status = status;
  if (userId !== undefined) doctor.userId = userId;

  return res.status(200).json(doctor);
}

export function deleteDoctor(req, res) {
  const index = doctors.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  doctors.splice(index, 1);
  return res.status(200).json({ message: "Doctor deleted" });
}
