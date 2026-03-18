const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
} = require("../controllers/group.controller");

const router = express.Router();

router.use(protect);

router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/:id", getGroupById);
router.put("/:id", updateGroup);
router.delete("/:id", deleteGroup);
router.post("/:id/members", addMember);
router.delete("/:id/members/:userId", removeMember);
router.post("/:id/leave", leaveGroup);

module.exports = router;
module.exports.default = router;
