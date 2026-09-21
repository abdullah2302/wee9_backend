import Wishlist from "../models/Wishlist.js";

// @route GET /api/wishlist
export async function getWishlist(req, res, next) {
    try {
        const wishlist = await Wishlist.findOne({
            user: req.user._id,
        }).populate("products");
        res.json(wishlist || { products: [] });
    } catch (err) {
        next(err);
    }
}

// @route POST /api/wishlist   body: { productId }
export async function addToWishlist(req, res, next) {
    try {
        const { productId } = req.body;

        let wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: req.user._id,
                products: [],
            });
        }

        if (!wishlist.products.some((p) => p.toString() === productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
        }

        await wishlist.populate("products");
        res.status(201).json(wishlist);
    } catch (err) {
        next(err);
    }
}

// @route DELETE /api/wishlist/:productId
export async function removeFromWishlist(req, res, next) {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        if (!wishlist) {
            res.status(404);
            throw new Error("Wishlist not found");
        }

        wishlist.products = wishlist.products.filter(
            (p) => p.toString() !== req.params.productId
        );

        await wishlist.save();
        await wishlist.populate("products");
        res.json(wishlist);
    } catch (err) {
        next(err);
    }
}