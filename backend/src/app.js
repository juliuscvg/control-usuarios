const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");


function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

 app.get("/", (req, res) => {
  res.send("API Control de Usuarios OK. Usa /health");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);


  return app;
}

module.exports = createApp;
