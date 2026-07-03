import jwt from 'jsonwebtoken';

export const protect = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    if (roles.length && !roles.includes(verified.role)) {
      return res.status(403).json({ error: "Unauthorized view rights." });
    }
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Session State Token" });
  }
};