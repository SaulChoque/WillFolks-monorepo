// Pays the QR the way a bank app would: TilcAI records the payment of QR_ID.
const answer = http.post(QR_PAY_URL, {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ qr_id: Number(QR_ID), payment_name: "JUAN PEREZ", payment_bank: "BANCO NACIONAL DE BOLIVIA" }),
});
if (answer.status !== 200) throw new Error(`QR payment failed: HTTP ${answer.status} ${answer.body}`);
output.qrPaid = json(answer.body).data.status;
