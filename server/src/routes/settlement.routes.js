const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  getSettlementSuggestions,
  createSettlement,
  confirmSettlement,
  getGroupSettlements,
} = require("../controllers/settlement.controller");

const router = express.Router();

router.use(protect);

router.get("/suggestions/:groupId", getSettlementSuggestions);
router.post("/", createSettlement);
router.put("/:id/confirm", confirmSettlement);
router.get("/group/:groupId", getGroupSettlements);

module.exports = router;
module.exports.default = router;
