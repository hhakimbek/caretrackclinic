import jwt from "jsonwebtoken";

const ACCESS_SECRET = "CARE_TRACK_ACCESS_SECRET";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token is missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
}
