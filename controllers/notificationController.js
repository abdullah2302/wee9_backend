import Notification from "../models/Notification.js";

export async function getMyNotifications(req, res, next) {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id,
        })
            .sort({ createdAt: -1 })
            .limit(30);

        res.json(notifications);
    } catch (error) {
        next(error);
    }
}

export async function markNotificationRead(req, res, next) {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                recipient: req.user._id,
            },
            { read: true },
            { new: true }
        );

        if (!notification) {
            res.status(404);
            throw new Error("Notification not found");
        }

        res.json(notification);
    } catch (error) {
        next(error);
    }
}
