
import Order from "../models/Order.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";



export const createOrder = async (req, res) => {
    try {
        if (req.user.role === "admin") {
            return res.status(403).json({
                message: "Admins can manage orders but cannot place orders",
            });
        }

        const {
            items,
            shippingAddress,
            paymentMethod,
            subtotal,
            shipping,
            total,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty",
            });
        }

        const order = await Order.create({
            user: req.user._id,

            items,

            shippingAddress,

            paymentMethod,

            subtotal,
            shipping,
            total,

            status: "pending",
        });

        const admins = await User.find({ role: "admin" }).select("_id");
        await Notification.insertMany(
            admins.map((admin) => ({
                recipient: admin._id,
                type: "new_order",
                message: `New order #${order._id.toString().slice(-8)} received`,
                order: order._id,
            }))
        );

        res.status(201).json({
            message: "Order placed successfully",
            order,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};




export const getMyOrders = async (req, res) => {
    try {
        const { orders, pagination } = await getPaginatedOrders(
            { user: req.user._id },
            req.query
        );

        res.status(200).json({ orders, pagination });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};



export const getAllOrders = async (req, res) => {
    try {
        const { orders, pagination } = await getPaginatedOrders({}, req.query);

        res.status(200).json({ orders, pagination });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

async function getPaginatedOrders(match, query) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(Number.parseInt(query.limit, 10) || 10, 1),
        50
    );

    const [result] = await Order.aggregate([
        { $match: match },
        {
            $facet: {
                orders: [
                    { $sort: { createdAt: -1 } },
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "users",
                            localField: "user",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            "user.password": 0,
                            "user.__v": 0,
                        },
                    },
                ],
                metadata: [{ $count: "total" }],
            },
        },
    ]);

    const total = result.metadata[0]?.total || 0;
    return {
        orders: result.orders,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}




export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid order status",
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status,
            },
            {
                new: true,
                runValidators: true,
            }
        ).populate("user", "name email");

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        await Notification.create({
            recipient: order.user._id,
            type: "order_status",
            message: `Order #${order._id.toString().slice(-8)} is now ${status}`,
            order: order._id,
        });

        res.status(200).json({
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

