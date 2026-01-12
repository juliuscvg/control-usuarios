// Almacén en memoria (se reinicia al reiniciar el servidor)
const users = new Map(); // key: email, value: user

// user = { id, email, name, passwordHash, role, createdAt }
module.exports = { users };
