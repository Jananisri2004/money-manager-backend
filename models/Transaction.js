const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: Number,
  category: String,
  division: { type: String, enum: ["Personal", "Office"] },
  account: { type: String, enum: ["Cash", "Bank"], default: "Cash" },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", TransactionSchema);
