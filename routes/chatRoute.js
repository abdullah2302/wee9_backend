import express from "express";
import { getConversations, getMessages, markMessagesRead } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/messages", getMessages);
router.get("/conversations", getConversations);
router.patch("/read/:customerId", markMessagesRead);

export default router;