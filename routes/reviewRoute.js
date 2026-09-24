import express from "express";
import {
    createReview,
    getMyReviews,
    getProductReviews,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.use(protect);
router.post("/", createReview);
router.get("/my-reviews", getMyReviews);

export default router;