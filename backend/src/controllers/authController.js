import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { users, refreshTokens } from "../data/db.js";

const ACCESS_SECRET = "CARE_TRACK_ACCESS_SECRET";
const REFRESH_SECRET = "CARE_TRACK_REFRESH_SECRET";
const ALLOWED_ROLES = ["admin", "receptionist", "clinician"];

function buildTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: "1h" },
  );

  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  refreshTokens.push({ token: refreshToken, userId: user.id });
  return { accessToken, refreshToken };
}

export async function register(req, res) {
  const { fullName, email, password, role = "receptionist" } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email and password are required" });
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role. Use admin, receptionist or clinician" });
  }

  const existingUser = users.find((item) => item.email === email);
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    fullName,
    email,
    password: passwordHash,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  const tokens = buildTokens(newUser);

  return res.status(201).json({
    message: "Registered successfully",
    user: { id: newUser.id, fullName, email, role },
    ...tokens,
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = users.find((item) => item.email === email);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatched = await bcrypt.compare(password, user.password);
  if (!isMatched) {
    return res.status(403).json({ message: "Password is incorrect" });
  }

  const tokens = buildTokens(user);

  return res.status(200).json({
    message: "Login successful",
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    ...tokens,
  });
}

export function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "refreshToken is required" });
  }

  const tokenInStore = refreshTokens.find((item) => item.token === refreshToken);
  if (!tokenInStore) {
    return res.status(403).json({ message: "Refresh token not recognized" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((item) => item.id === decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: "1h" },
    );

    return res.status(200).json({ accessToken });
  } catch {
    return res.status(401).json({ message: "Refresh token expired or invalid" });
  }
}

export function logout(req, res) {
  const { refreshToken } = req.body;

  const index = refreshTokens.findIndex((item) => item.token === refreshToken);
  if (index !== -1) {
    refreshTokens.splice(index, 1);
  }

  return res.status(200).json({ message: "Logged out" });
}
