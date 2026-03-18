const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require("../controllers/expense.controller");

const router = express.Router();

router.use(protect);

router.post("/", createExpense);
router.get("/group/:groupId", getGroupExpenses);
router.get("/:id", getExpenseById);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
module.exports.default = router;
