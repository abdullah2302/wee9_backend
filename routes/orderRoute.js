
import express from "express";

import {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
} from "../controllers/orderController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();
router.post("/", protect, createOrder);


router.get("/my", protect, getMyOrders);

router.get(
    "/all",
    protect,
    adminOnly,
    getAllOrders
);

router.patch(
    "/:id/status",
    protect,
    adminOnly,
    updateOrderStatus
);

export default router;

