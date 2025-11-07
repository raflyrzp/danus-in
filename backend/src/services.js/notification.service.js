import pool from "../config/db.js";
export async function createNotification(userId, { title, message }) {
  await pool.query(
    "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
    [userId, title, message]
  );
}

export async function listNotifications(userId) {
  const [rows] = await pool.query(
    "SELECT id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_by DESC",
    [userId]
  );
  return rows;
}

export async function markRead(userId, notificationId) {
  const [rows] = await pool.query(
    "SELECT user_id FROM notifications WHERE id = ?",
    [notificationId]
  );
  if (!rows.length) throw new Error("Notifikasi tidak ditemukan");
  if (rows[0].user_id !== userId)
    throw new Error("Tidak boleh mengubah notifikasi orang lain");
  await pool.query("UPDATE notifications SET is_read=1 WHERE id=?", [
    notificationId,
  ]);
  return { message: "Notifikasi ditandai sudah dibaca" };
}
