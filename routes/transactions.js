const router = require("express").Router();
const Transaction = require("../models/Transaction");

// Get all
router.get("/", async (req, res) => {
  const data = await Transaction.find().sort({ date: -1 });
  res.json(data);
});

// Add
router.post("/", async (req, res) => {
  try {

    console.log("BODY:", req.body);

    const { amount, type, category, division, date } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const tx = await Transaction.create({
      amount: Number(amount),
      type: type.toLowerCase(),
      category,
      division,
      date: date ? new Date(date) : new Date()
    });

    res.json(tx);

  } catch (error) {

    console.error("POST ERROR:", error);

    res.status(500).json({
      message: error.message
    });
  }
});


// Edit (12-hour rule)
router.put("/edit/:id", async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if ((Date.now() - tx.date) > 12 * 60 * 60 * 1000) {
    return res.status(403).json({ message: "Edit window expired" });
  }
  await Transaction.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Updated" });
});

// Filter
router.get("/filter", async (req, res) => {
  const { from, to, category } = req.query;
  let query = {};

  if (from && to) {
    query.date = { $gte: new Date(from), $lte: new Date(to) };
  }
  if (category) query.category = category;

  const data = await Transaction.find(query);
  res.json(data);
});

// Summary (month/week/year)
router.get("/summary", async (req, res) => {
  const { range } = req.query;
  let start = new Date(0);
  const now = new Date();

  if (range === "month") start = new Date(now.getFullYear(), now.getMonth(), 1);
  if (range === "week") start = new Date(now.setDate(now.getDate() - 7));
  if (range === "year") start = new Date(now.getFullYear(), 0, 1);

  const data = await Transaction.find({ date: { $gte: start } });
  let income = 0, expense = 0;

  data.forEach(t => t.type === "income" ? income += t.amount : expense += t.amount);
  res.json({ income, expense, balance: income - expense });
});

// Category summary
router.get("/category-summary", async (req, res) => {
  const data = await Transaction.aggregate([
    { $group: { _id: "$category", total: { $sum: "$amount" } } }
  ]);
  res.json(data);
});

// Transfer
router.post("/transfer", async (req, res) => {
  const { from, to, amount } = req.body;

  await Transaction.create({ type:"expense", category:"Transfer", amount, account:from });
  await Transaction.create({ type:"income", category:"Transfer", amount, account:to });

  res.json({ message: "Transfer successful" });
});



module.exports = router;
