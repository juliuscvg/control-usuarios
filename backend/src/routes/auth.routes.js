const router = require("express").Router();
const { z } = require("zod");
const crypto = require("crypto");

const { users } = require("../store");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional()
});

router.post("/register", async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);

    const email = data.email.toLowerCase();
    if (users.has(email)) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      name: data.name || null,
      passwordHash: await hashPassword(data.password),
      role: "user",
      createdAt: new Date().toISOString()
    };

    users.set(email, user);

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    next(err);
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const key = email.toLowerCase();

    const user = users.get(key);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
