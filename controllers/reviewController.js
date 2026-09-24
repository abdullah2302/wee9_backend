import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";

function validId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

export async function createReview(req, res, next) {
    try {
        const { productId, orderId, rating, comment } = req.body;

        if (!validId(productId) || !validId(orderId)) {
            return res.status(400).json({ message: "Invalid product or order" });
        }

        const numericRating = Number(rating);
        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        if (typeof comment !== "string" || !comment.trim()) {
            return res.status(400).json({ message: "Review comment is required" });
        }

        const [order, product] = await Promise.all([
            Order.findOne({ _id: orderId, user: req.user._id }),
            Product.findById(productId),
        ]);

        if (!order || order.status !== "delivered") {
            return res.status(403).json({
                message: "You can only review products from delivered orders.",
            });
        }

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const purchased = order.items.some(
            (item) => item.product.toString() === productId.toString()
        );
        if (!purchased) {
            return res.status(403).json({ message: "You did not purchase this product." });
        }

        const existing = await Review.findOne({
            user: req.user._id,
            product: productId,
            order: orderId,
        });
        if (existing) {
            return res.status(409).json({ message: "You have already reviewed this product." });
        }

        const review = await Review.create({
            user: req.user._id,
            product: productId,
            order: orderId,
            rating: numericRating,
            comment: comment.trim(),
        });

        await review.populate("user", "name");
        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "You have already reviewed this product." });
        }
        next(error);
    }
}

export async function getProductReviews(req, res, next) {
    try {
        if (!validId(req.params.productId)) {
            return res.status(400).json({ message: "Invalid product id" });
        }

        const reviews = await Review.find({ product: req.params.productId })
            .populate("user", "name")
            .sort({ createdAt: -1 });
        const average = reviews.length
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;

        res.json({
            reviews,
            summary: {
                average: Number(average.toFixed(1)),
                total: reviews.length,
                distribution: [5, 4, 3, 2, 1].map((value) => ({
                    rating: value,
                    count: reviews.filter((review) => review.rating === value).length,
                })),
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getMyReviews(req, res, next) {
    try {
        const reviews = await Review.find({ user: req.user._id }).select("product order");
        res.json(reviews);
    } catch (error) {
        next(error);
    }
}