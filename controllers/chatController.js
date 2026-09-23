import mongoose from "mongoose";
import ChatMessage from "../models/ChatMessage.js";

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function serializeMessage(message, viewerId) {
    return {
        id: message._id.toString(),
        sender: {
            id: message.sender._id.toString(),
            name: message.sender.name,
            role: message.sender.role,
        },
        recipientId: message.recipient?._id?.toString() || message.recipientRole,
        text: message.text,
        product: message.product
            ? { ...message.product.toObject(), id: message.product.id.toString() }
            : null,
        createdAt: message.createdAt,
        read: message.readBy.some((id) => id.toString() === viewerId),
    };
}

async function loadMessages(filter, viewerId) {
    const messages = await ChatMessage.find(filter)
        .populate("sender", "name role")
        .populate("recipient", "name role")
        .sort({ createdAt: 1 })
        .limit(200);

    return messages.map((message) => serializeMessage(message, viewerId));
}

export async function getMessages(req, res, next) {
    try {
        const userId = req.user._id.toString();
        let filter;

        if (req.user.role === "admin" && req.query.customerId) {
            if (!isValidId(req.query.customerId)) {
                return res.status(400).json({ message: "Invalid customer id" });
            }

            filter = {
                $or: [
                    { sender: req.query.customerId, recipientRole: "admin" },
                    { sender: req.user._id, recipient: req.query.customerId },
                ],
            };
        } else if (req.user.role === "admin") {
            filter = { recipientRole: "admin" };
        } else {
            filter = {
                $or: [
                    { sender: req.user._id, recipientRole: "admin" },
                    { recipient: req.user._id },
                ],
            };
        }

        res.json(await loadMessages(filter, userId));
    } catch (error) {
        next(error);
    }
}

export async function getConversations(req, res, next) {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        const messages = await ChatMessage.find({
            $or: [{ recipientRole: "admin" }, { recipient: req.user._id }],
        })
            .populate("sender", "name email role")
            .populate("recipient", "name email role")
            .sort({ createdAt: -1 })
            .limit(1000);

        const conversations = new Map();
        for (const message of messages) {
            const customer = message.sender.role === "user" ? message.sender : message.recipient;
            if (!customer) continue;

            const customerId = customer._id.toString();
            if (!conversations.has(customerId)) {
                conversations.set(customerId, {
                    customer: { id: customerId, name: customer.name, email: customer.email },
                    latestMessage: message.text,
                    updatedAt: message.createdAt,
                    unreadCount: 0,
                });
            }

            if (!message.readBy.some((id) => id.equals(req.user._id)) && message.sender.role !== "admin") {
                conversations.get(customerId).unreadCount += 1;
            }
        }

        res.json([...conversations.values()]);
    } catch (error) {
        next(error);
    }
}

export async function markMessagesRead(req, res, next) {
    try {
        const filter = req.user.role === "admin"
            ? {
                  sender: req.params.customerId,
                  recipientRole: "admin",
                  readBy: { $ne: req.user._id },
              }
            : {
                  sender: { $ne: req.user._id },
                  recipient: req.user._id,
                  readBy: { $ne: req.user._id },
              };

        const result = await ChatMessage.updateMany(filter, {
            $addToSet: { readBy: req.user._id },
        });
        res.json({
            message: "Chat messages marked as read",
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        next(error);
    }
}