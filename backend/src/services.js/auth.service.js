import pool from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import jwt from "jsonwebtoken";

function buildUserRow(row) {
  return {
    id: row.id,
    nim: row.nim,
    name: row.name,
    major: row.major,
    faculty: row.faculty,
    batch_year: row.batch_year,
    whatsapp: row.whatsapp,
    email: row.email,
    role: row.role,
  };
}

export async function register(data) {
  const {
    nim,
    name,
    major,
    faculty,
    batch_year,
    whatsapp,
    email,
    password,
    role,
  } = data;

  // Basic validations
  if (!nim) throw new Error("NIM wajib diisi");
  if (!password) throw new Error("Password wajib diisi");
  if (!["buyer", "seller"].includes(role))
    throw new Error("Role tidak valid (buyer/seller)");

  const [existingNim] = await pool.query("SELECT id FROM users WHERE nim = ?", [
    nim,
  ]);
  if (existingNim.length) throw new Error("NIM sudah terdaftar");

  if (email) {
    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingEmail.length) throw new Error("Email sudah terdaftar");
  }

  const hashed = await hashPassword(password);

  const [result] = await pool.query(
    `INSERT INTO users (nim, name, major, faculty, batch_year, whatsapp, email, password, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [nim, name, major, faculty, batch_year, whatsapp, email, hashed, role]
  );

  return {
    id: result.insertId,
    nim,
    name,
    major,
    faculty,
    batch_year,
    whatsapp,
    email,
    role,
  };
}

export async function login({ credential, password }) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE nim = ? OR email = ? LIMIT 1",
    [credential, credential]
  );
  if (!rows.length)
    throw new Error("User tidak ditemukan dengan NIM / email tersebut");
  const user = rows[0];

  const match = await comparePassword(password, user.password);
  if (!match) throw new Error("Password salah");

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

  return { token, user: buildUserRow(user) };
}

export async function getProfile(userId) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
  if (!rows.length) throw new Error("User tidak ditemukan");
  return buildUserRow(rows[0]);
}

export async function updateProfile(userId, data) {
  const allowed = [
    "name",
    "major",
    "faculty",
    "batch_year",
    "whatsapp",
    "email",
    "password",
  ];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (data[key] !== undefined && data[key] !== null) {
      if (key === "password") {
        const hashed = await hashPassword(data[key]);
        sets.push("password=?");
        values.push(hashed);
      } else {
        sets.push(`${key}=?`);
        values.push(data[key]);
      }
    }
  }
  if (!sets.length) return { message: "Tidak ada perubahan" };

  values.push(userId);
  await pool.query(`UPDATE users SET ${sets.join(", ")} WHERE id=?`, values);
  return { message: "Profil diperbarui" };
}
