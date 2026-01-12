require("dotenv").config();
const createApp = require("./app");

const app = createApp();
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`Backend listo en http://localhost:${PORT}`);
});
