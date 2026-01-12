const router = require("express").Router();
const auth = require("../middleware/auth");
const { users } = require("../store");

router.get("/me", auth, (req, res) => {
  // buscamos por email porque el store está indexado por email
  const user = users.get(req.user.email.toLowerCase());
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt
  });
});

module.exports = router;
