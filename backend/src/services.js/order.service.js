import pool from "../config/db.js";
import { ORDER_STATUS, VALID_TRANSITIONS } from "../constants/orderStatus.js";
import { createNotification } from "./notification.service.js";

export async function createOrder(buyerId, { product_id, quantity }) {
  const [prodRows] = await pool.query(
    "SELECT id, price, seller_id, po_open_date, po_close_date FROM products WHERE id=?",
    [product_id]
  );
  if (!prodRows.length) throw new Error("Produk tidak ditemukan");
  const product = prodRows[0];

  const today = new Date().toISOString().slice(0, 10);
  if (today < product.po_open_date || today > product.po_close_date) {
    throw new Error("Produk tidak dalam masa pemesanan");
  }

  const total_price = product.price * quantity;
  const [result] = await pool.query(
    "INSERT INTO orders (buyer_id, seller_id, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?, ?)",
    [
      buyerId,
      product.seller_id,
      product_id,
      quantity,
      total_price,
      ORDER_STATUS.MENUNGGU,
    ]
  );

  await createNotification(product.seller_id, {
    title: "Pesanan Baru",
    message: `Anda memiliki pesanan baru untuk produk ${product.name} dari pembeli ID ${buyerId}.`,
  });
  return { id: result.insertId, total_price };
}
