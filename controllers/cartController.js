import Cart from "../models/Cart.js";

// All routes here are protected — req.user is always set.

// @route GET /api/cart
export async function getCart(req, res, next) {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate(
            "items.product"
        );
        res.json(cart || { items: [] });
    } catch (err) {
        next(err);
    }
}

// @route POST /api/cart   body: { productId, qty? }
export async function addToCart(req, res, next) {
    try {
        const { productId, qty = 1 } = req.body;

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

        const existing = cart.items.find(
            (item) => item.product.toString() === productId
        );

        if (existing) {
            existing.qty += qty;
        } else {
            cart.items.push({ product: productId, qty });
        }

        await cart.save();
        await cart.populate("items.product");
        res.status(201).json(cart);
    } catch (err) {
        next(err);
    }
}

// @route PUT /api/cart/:productId   body: { qty }
export async function updateCartItem(req, res, next) {
    try {
        const { qty } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            res.status(404);
            throw new Error("Cart not found");
        }

        const item = cart.items.find(
            (i) => i.product.toString() === req.params.productId
        );
        if (!item) {
            res.status(404);
            throw new Error("Item not in cart");
        }

        if (qty < 1) {
            cart.items = cart.items.filter(
                (i) => i.product.toString() !== req.params.productId
            );
        } else {
            item.qty = qty;
        }

        await cart.save();
        await cart.populate("items.product");
        res.json(cart);
    } catch (err) {
        next(err);
    }
}

// @route DELETE /api/cart/:productId
export async function removeFromCart(req, res, next) {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            res.status(404);
            throw new Error("Cart not found");
        }

        cart.items = cart.items.filter(
            (i) => i.product.toString() !== req.params.productId
        );

        await cart.save();
        await cart.populate("items.product");
        res.json(cart);
    } catch (err) {
        next(err);
    }
}

// @route DELETE /api/cart
export async function clearCart(req, res, next) {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json(cart || { items: [] });
    } catch (err) {
        next(err);
    }
}