import fs from "fs";
import path from "path";

const isVercel = !!process.env.VERCEL; // se for produção, grava em /tmp
const dataDir = isVercel ? "/tmp" : path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "db.json");

const initialData = {
  users: [] // cada usuário terá id, email, senha hash, plano, limites e uso
};

// 📂 Garante que o arquivo e diretório existem
function ensureFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
}

// 📖 Ler base de dados
export function readDB() {
  ensureFile();
  const raw = fs.readFileSync(dbFile, "utf8");
  return JSON.parse(raw || "{}");
}

// ✍️ Escrever base de dados
export function writeDB(db) {
  ensureFile();
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

// 🔍 Buscar usuário por e-mail
export function getUserByEmail(email) {
  const db = readDB();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// 🔍 Buscar usuário por ID
export function getUserById(id) {
  const db = readDB();
  return db.users.find(u => u.id === id);
}

// 📩 Criar ou atualizar usuário
export function upsertUser(user) {
  const db = readDB();
  const index = db.users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    db.users[index] = user;
  } else {
    db.users.push(user);
  }
  writeDB(db);
  return user;
}

// 📋 Listar todos os usuários (para admin)
export function listUsers() {
  const db = readDB();
  return db.users;
}
