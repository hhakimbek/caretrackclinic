import { v4 as uuidv4 } from "uuid";
import { appointments, doctors, patients } from "../data/db.js";

export function getAppointments(req, res) {
  return res.status(200).json(appointments);
}

export function getMyAppointments(req, res) {
  const myAppointments = appointments.filter((item) => item.clinicianUserId === req.user.id);
  return res.status(200).json(myAppointments);
}

export function createAppointment(req, res) {
  const { patientId, doctorId, scheduledAt, notes } = req.body;

  if (!patientId || !doctorId || !scheduledAt) {
    return res.status(400).json({ message: "patientId, doctorId and scheduledAt are required" });
  }

  const patient = patients.find((item) => item.id === patientId);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  const doctor = doctors.find((item) => item.id === doctorId);
  if (!doctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  const newAppointment = {
    id: uuidv4(),
    patientId,
    doctorId,
    clinicianUserId: doctor.userId || null,
    scheduledAt,
    notes: notes || "",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };

  appointments.push(newAppointment);
  return res.status(201).json(newAppointment);
}

export function updateAppointmentStatus(req, res) {
  const appointment = appointments.find((item) => item.id === req.params.id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (req.user.role === "clinician" && appointment.clinicianUserId !== req.user.id) {
    return res.status(403).json({ message: "You can only update your own appointments" });
  }

  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ message: "status is required" });
  }

  appointment.status = status;
  return res.status(200).json(appointment);
}

export function deleteAppointment(req, res) {
  const index = appointments.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  appointments.splice(index, 1);
  return res.status(200).json({ message: "Appointment deleted" });
}
