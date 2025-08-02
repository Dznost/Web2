const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, notificationController.getNotifications);
router.get("/:notificationId/reply", requireAuth, notificationController.showReplyForm);
router.post("/:notificationId/reply", requireAuth, notificationController.submitReply);
router.get("/:notificationId/replies", requireAuth, notificationController.viewReplies);

module.exports = router;