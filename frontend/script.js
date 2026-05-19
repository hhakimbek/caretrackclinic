const API_BASE_URL = "http://localhost:5000/api";

const loginForm = document.getElementById("loginForm");
const roleSelect = document.getElementById("role");
const registerBtn = document.getElementById("registerBtn");
let selectedPatientId = null;
let selectedDoctorId = null;

function showMessage(message) {
  alert(message);
}

function normalizeRole(roleValue) {
  const role = String(roleValue || "").toLowerCase();
  if (role === "administrator" || role === "admin") return "admin";
  if (role === "clinician") return "clinician";
  return "receptionist";
}

function roleForUi(role) {
  if (role === "admin") return "Administrator";
  if (role === "clinician") return "Clinician";
  return "Receptionist";
}

function getAccessToken() { return localStorage.getItem("caretrack_access_token"); }
function getRefreshToken() { return localStorage.getItem("caretrack_refresh_token"); }
function getRole() { return localStorage.getItem("caretrack_role") || "Receptionist"; }

function setAuthSession(data) {
  localStorage.setItem("caretrack_access_token", data.accessToken);
  localStorage.setItem("caretrack_refresh_token", data.refreshToken);
  localStorage.setItem("caretrack_role", roleForUi(data.user.role));
  localStorage.setItem("caretrack_user_id", data.user.id);
}

function clearAuthSession() {
  localStorage.removeItem("caretrack_access_token");
  localStorage.removeItem("caretrack_refresh_token");
  localStorage.removeItem("caretrack_role");
  localStorage.removeItem("caretrack_user_id");
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) { clearAuthSession(); window.location.href = "index.html"; return null; }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) { clearAuthSession(); window.location.href = "index.html"; return null; }

  const data = await response.json();
  localStorage.setItem("caretrack_access_token", data.accessToken);
  return data.accessToken;
}

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && !options.skipAuth) {
    const newToken = await refreshAccessToken();
    if (!newToken) return response;
    headers.Authorization = `Bearer ${newToken}`;
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  }

  return response;
}

function openModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.classList.add("show"); }
function closeModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.classList.remove("show"); }

function setRoleBadge(role) {
  const roleBadge = document.getElementById("roleBadge");
  if (roleBadge) roleBadge.textContent = `Role: ${role}`;
}

function hideElements(selector) {
  document.querySelectorAll(selector).forEach((el) => el.classList.add("is-hidden-by-role"));
}

function applyRoleUI() {
  const role = getRole();
  setRoleBadge(role);

  if (role === "Administrator") hideElements(".non-admin-only");
  if (role === "Clinician") {
    hideElements(".admin-only");
    hideElements(".reception-only");
    hideElements(".can-add-patient");
    hideElements(".can-edit-patient");
  }
  if (role === "Receptionist") {
    hideElements(".admin-only");
  }
}

function guardPrivatePage() {
  const path = window.location.pathname.toLowerCase();
  const isLoginPage = path.endsWith("index.html") || path.endsWith("/frontend/") || path.endsWith("/frontend");
  if (!isLoginPage && !getAccessToken()) window.location.href = "index.html";
}

async function doRegister() {
  const fullName = document.getElementById("fullName")?.value.trim() || "New User";
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value.trim();
  const selectedRole = normalizeRole(roleSelect?.value);

  if (!email || !password || !selectedRole) { showMessage("Full role, email va password kiriting"); return; }

  const response = await apiRequest("/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password, role: selectedRole }), skipAuth: true,
  });

  const data = await response.json();
  if (!response.ok) { showMessage(data.message || "Register failed"); return; }

  setAuthSession(data);
  window.location.href = "dashboard.html";
}

async function handleLogin() {
  if (!loginForm || !roleSelect) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const selectedRole = normalizeRole(roleSelect.value);

    const response = await apiRequest("/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }), skipAuth: true,
    });

    const data = await response.json();
    if (!response.ok) { showMessage(`${data.message || "Login failed"}. Avval Register bosing.`); return; }
    if (data.user.role !== selectedRole) { showMessage("Selected role does not match account role"); return; }

    setAuthSession(data);
    window.location.href = "dashboard.html";
  });

  if (registerBtn) registerBtn.addEventListener("click", doRegister);
}

async function loadDoctors() { const r = await apiRequest("/doctors"); if (!r.ok) return []; return r.json(); }
async function loadPatients() { const r = await apiRequest("/patients"); if (!r.ok) return []; return r.json(); }
async function loadAppointments() {
  const endpoint = "/appointments";
  const r = await apiRequest(endpoint);
  if (!r.ok) return [];
  return r.json();
}
async function loadDiagnoses() {
  const r = await apiRequest("/diagnoses");
  if (!r.ok) return [];
  return r.json();
}

function bindLogoutLinks() {
  document.querySelectorAll('a[href="index.html"]').forEach((link) => {
    link.addEventListener("click", async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await apiRequest("/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
      }
      clearAuthSession();
    });
  });
}

function getDoctorNameById(doctors, id) {
  const doc = doctors.find((d) => d.id === id);
  return doc ? doc.fullName : "-";
}

async function initDashboardPage() {
  if (!document.getElementById("visitsLineChart")) return;
  const [patients, doctors, appointments] = await Promise.all([loadPatients(), loadDoctors(), loadAppointments()]);
  const cards = document.querySelectorAll(".stat-number");
  if (cards[0]) cards[0].textContent = String(doctors.length);
  if (cards[1]) cards[1].textContent = String(patients.length);
  if (cards[2]) cards[2].textContent = String(appointments.length);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = appointments.filter((a) => String(a.scheduledAt || "").startsWith(today)).length;
  if (cards[3]) cards[3].textContent = String(todayCount);
}

async function initPatientsPage() {
  const tableBody = document.getElementById("patientsTableBody");
  if (!tableBody) return;
  const [patients, doctors] = await Promise.all([loadPatients(), loadDoctors()]);
  const addDoctorSelect = document.getElementById("assignedDoctor");
  const editDoctorSelect = document.getElementById("editAssignedDoctor");
  const doctorOptions = doctors.map((d) => `<option value="${d.id}">${d.fullName}</option>`).join("");
  if (addDoctorSelect) addDoctorSelect.innerHTML = doctorOptions;
  if (editDoctorSelect) editDoctorSelect.innerHTML = doctorOptions;

  function fillProfile(patient) {
    document.getElementById("profileId").textContent = patient.id;
    document.getElementById("profileName").textContent = patient.fullName || "-";
    document.getElementById("profileAge").textContent = patient.dateOfBirth || "-";
    document.getElementById("profileGender").textContent = patient.gender || "-";
    document.getElementById("profileDoctor").textContent = getDoctorNameById(doctors, patient.doctorId);
    document.getElementById("profilePhone").textContent = patient.phone || "-";
  }

  function render() {
    tableBody.innerHTML = "";
    patients.forEach((p) => {
      const tr = document.createElement("tr");
      tr.className = "patient-row";
      tr.innerHTML = `<td>${p.id}</td><td>${p.fullName || "-"}</td><td>${p.dateOfBirth || "-"}</td><td>${p.gender || "-"}</td><td>${getDoctorNameById(doctors, p.doctorId)}</td>`;
      tr.addEventListener("click", () => {
        selectedPatientId = p.id;
        document.querySelectorAll(".patient-row").forEach((r) => r.classList.remove("selected"));
        tr.classList.add("selected");
        fillProfile(p);
      });
      tableBody.appendChild(tr);
    });
    const first = tableBody.querySelector(".patient-row");
    if (first) first.click();
  }

  render();

  const editProfileBtn = document.querySelector('[data-open-modal="editPatientModal"]');
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const patient = patients.find((p) => p.id === selectedPatientId);
      if (!patient) { showMessage("Avval patient tanlang"); return; }
      document.getElementById("editPatientName").value = patient.fullName || "";
      document.getElementById("editPatientAge").value = patient.dateOfBirth || "";
      document.getElementById("editPatientGender").value = patient.gender || "Male";
      document.getElementById("editAssignedDoctor").value = patient.doctorId || "";
      document.getElementById("editPatientPhone").value = patient.phone || "";
      openModal("editPatientModal");
    });
  }

  const saveBtn = document.getElementById("savePatientBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const fullName = document.getElementById("patientFullName").value.trim();
      const dateOfBirth = document.getElementById("patientAge").value;
      const gender = document.getElementById("patientGender").value;
      const doctorId = document.getElementById("assignedDoctor").value || null;
      const phone = document.getElementById("patientPhone").value.trim();
      const response = await apiRequest("/patients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, phone, dateOfBirth, gender, doctorId }) });
      const data = await response.json();
      if (!response.ok) { showMessage(data.message || "Failed to create patient"); return; }
      patients.push(data); render(); closeModal("patientModal"); showMessage("Patient created");
    });
  }

  const updateBtn = document.getElementById("updatePatientBtn");
  if (updateBtn) {
    updateBtn.addEventListener("click", async () => {
      if (!selectedPatientId) { showMessage("Patient tanlanmagan"); return; }
      const fullName = document.getElementById("editPatientName").value.trim();
      const dateOfBirth = document.getElementById("editPatientAge").value;
      const gender = document.getElementById("editPatientGender").value;
      const doctorId = document.getElementById("editAssignedDoctor").value || null;
      const phone = document.getElementById("editPatientPhone").value.trim();
      const response = await apiRequest(`/patients/${selectedPatientId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, phone, dateOfBirth, gender, doctorId }) });
      const data = await response.json();
      if (!response.ok) { showMessage(data.message || "Failed to update patient"); return; }
      const idx = patients.findIndex((p) => p.id === data.id);
      if (idx !== -1) patients[idx] = data;
      render(); closeModal("editPatientModal"); showMessage("Patient updated");
    });
  }
}

async function initDoctorsPage() {
  const tableBody = document.getElementById("doctorsTableBody");
  if (!tableBody) return;
  const doctors = await loadDoctors();

  function statusBadge(status) {
    const s = String(status || "Active");
    if (s.toLowerCase().includes("leave")) return "medium";
    return "low";
  }

  function render() {
    tableBody.innerHTML = "";
    doctors.forEach((doc) => {
      const status = doc.status || "Active";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${doc.id}</td><td>${doc.fullName || "-"}</td><td>${doc.specialty || "-"}</td><td>${doc.phone || "-"}</td><td><span class="badge ${statusBadge(status)}">${status}</span></td><td><button class="btn btn-outline doctor-edit-btn" data-doctor-id="${doc.id}">Edit</button></td>`;
      tableBody.appendChild(tr);
    });

    document.querySelectorAll(".doctor-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedDoctorId = btn.dataset.doctorId;
        const doctor = doctors.find((d) => d.id === selectedDoctorId);
        if (!doctor) return;
        document.getElementById("editDoctorName").value = doctor.fullName || "";
        document.getElementById("editDoctorSpec").value = doctor.specialty || "";
        document.getElementById("editDoctorPhone").value = doctor.phone || "";
        document.getElementById("editDoctorStatus").value = doctor.status || "Active";
        openModal("editDoctorModal");
      });
    });
  }

  render();

  const saveBtn = document.getElementById("saveDoctorBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const fullName = document.getElementById("doctorName").value.trim();
      const specialty = document.getElementById("doctorSpec").value;
      const phone = document.getElementById("doctorPhone").value.trim();
      const status = document.getElementById("doctorStatus").value;
      const response = await apiRequest("/doctors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, specialty, phone, status }) });
      const data = await response.json();
      if (!response.ok) { showMessage(data.message || "Failed to create doctor"); return; }
      doctors.push(data); render(); closeModal("doctorModal"); showMessage("Doctor created");
    });
  }

  const updateBtn = document.getElementById("updateDoctorBtn");
  if (updateBtn) {
    updateBtn.addEventListener("click", async () => {
      if (!selectedDoctorId) { showMessage("Doctor tanlanmagan"); return; }
      const fullName = document.getElementById("editDoctorName").value.trim();
      const specialty = document.getElementById("editDoctorSpec").value;
      const phone = document.getElementById("editDoctorPhone").value.trim();
      const status = document.getElementById("editDoctorStatus").value;
      const response = await apiRequest(`/doctors/${selectedDoctorId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, specialty, phone, status }) });
      const data = await response.json();
      if (!response.ok) { showMessage(data.message || "Failed to update doctor"); return; }
      const idx = doctors.findIndex((d) => d.id === data.id);
      if (idx !== -1) doctors[idx] = data;
      render(); closeModal("editDoctorModal"); showMessage("Doctor updated");
    });
  }
}

async function initDiagnosesPage() {
  const tableBody = document.getElementById("diagnosisTableBody");
  if (!tableBody) return;

  const [patients, doctors] = await Promise.all([loadPatients(), loadDoctors()]);
  const diagnoses = await loadDiagnoses();

  const patientSelect = document.getElementById("diagnosisPatient");
  const doctorSelect = document.getElementById("diagnosisDoctor");
  if (patientSelect) patientSelect.innerHTML = patients.map((p) => `<option value="${p.id}">${p.fullName}</option>`).join("");
  if (doctorSelect) doctorSelect.innerHTML = doctors.map((d) => `<option value="${d.id}">${d.fullName}</option>`).join("");

  function pName(id) { const p = patients.find((x) => x.id === id); return p ? p.fullName : "-"; }
  function dName(id) { const d = doctors.find((x) => x.id === id); return d ? d.fullName : "-"; }

  function render() {
    tableBody.innerHTML = "";
    diagnoses.forEach((x) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${x.id}</td><td>${pName(x.patientId)}</td><td>${dName(x.doctorId)}</td><td>${x.icdCode || "-"}</td><td>${x.diagnosisName}</td><td>${x.severity || "Low"}</td>`;
      tableBody.appendChild(tr);
    });
  }

  render();

  const saveBtn = document.getElementById("saveDiagnosisBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const patientId = document.getElementById("diagnosisPatient").value;
      const doctorId = document.getElementById("diagnosisDoctor").value;
      const icdCode = document.getElementById("diagnosisIcd").value.trim();
      const diagnosisName = document.getElementById("diagnosisName").value.trim();
      const severity = document.getElementById("diagnosisSeverity").value;
      const notes = document.getElementById("diagnosisNotes").value.trim();

      const response = await apiRequest("/diagnoses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, doctorId, icdCode, diagnosisName, severity, notes }),
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(data.message || "Failed to create diagnosis");
        return;
      }

      diagnoses.push(data);
      render();
      closeModal("diagnosisModal");
      showMessage("Diagnosis created");
    });
  }
}
function initModals() {
  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.getAttribute("data-open-modal");
      openModal(modalId);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      if (modal) modal.classList.remove("show");
    });
  });

  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) event.target.classList.remove("show");
  });
}

(async function bootstrap() {
  guardPrivatePage();
  applyRoleUI();
  bindLogoutLinks();
  await handleLogin();
  await initDashboardPage();
  await initPatientsPage();
  await initDoctorsPage();
  await initDiagnosesPage();
  initModals();
})();




