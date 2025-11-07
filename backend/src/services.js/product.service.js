import pool from "../config/db.js";

export async function createProduct(sellerId, data) {
  const {
    name,
    description,
    price,
    image_url,
    po_open_date,
    po_close_date,
    delivery_date,
  } = data;
  const [result] = await pool.query(
    `INSERT INTO products (seller_id, name, description, price, image_url, po_open_date, po_close_date, delivery_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sellerId,
      name,
      description,
      price,
      image_url,
      po_open_date,
      po_close_date,
      delivery_date,
    ]
  );
  return { id: result.insertId };
}

export async function updateProduct(sellerId, productId, data) {
  const [rows] = await pool.query(
    "SELECT id, seller_id FROM products WHERE id = ?",
    [productId]
  );
  if (!rows.length) throw new Error("Produk tidak ditemukan");
  if (rows[0].seller_id !== sellerId)
    throw new Error("Tidak boleh mengubah produk orang lain");

  const fields = [];
  const values = [];
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined) {
      fields.push(`${k}=?`);
      values.push(v);
    }
  });
  if (!fields.length) return { message: "Tidak ada perubahan" };
  values.push(productId);
  await pool.query(
    `UPDATE products SET ${fields.join(", ")} WHERE id=?`,
    values
  );
  return { message: "Berhasil update" };
}

export async function deleteProduct(sellerId, productId) {
  const [rows] = await pool.query(
    "SELECT seller_id FROM products WHERE id = ?",
    [productId]
  );
  if (!rows.length) throw new Error("Produk tidak ditemukan");
  if (rows[0].seller_id !== sellerId)
    throw new Error("Tidak boleh menghapus produk orang lain");
  await pool.query("DELETE FROM products WHERE id = ?", [productId]);
  return { message: "Berhasil hapus" };
}

export async function getProduct(productId) {
  const [rows] = await pool.query(
    `SELECT p.*, u.name as seller_name
     FROM products p
     JOIN users u ON p.seller_id = u.id
     WHERE p.id = ?`,
    [productId]
  );
  if (!rows.length) throw new Error("Produk tidak ditemukan");
  return rows[0];
}

export async function listProducts({ q, min_price, max_price, open_only }) {
  const conditions = [];
  const params = [];

  if (q) {
    conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (min_price) {
    conditions.push("p.price >= ?");
    params.push(min_price);
  }
  if (max_price) {
    conditions.push("p.price <= ?");
    params.push(max_price);
  }
  if (open_only === "true") {
    conditions.push("CURDATE() BETWEEN p.po_open_date AND p.po_close_date");
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.price, p.image_url, p.po_open_date, p.po_close_date, p.delivery_date,
            u.name as seller_name
     FROM products p
     JOIN users u ON p.seller_id = u.id
     ${where}
     ORDER BY p.created_at DESC`,
    params
  );
  return rows;
}

export async function listSellerProducts(sellerId) {
  const [rows] = await pool.query(
    `SELECT id, name, price, po_open_date, po_close_date, delivery_date, created_at
     FROM products WHERE seller_id = ? ORDER BY created_at DESC`,
    [sellerId]
  );
  return rows;
}
