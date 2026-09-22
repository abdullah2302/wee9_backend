import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        inStock: { type: Boolean, default: true },
    },
    { timestamps: true }
);

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ name: "text" });

export default mongoose.model("Product", productSchema);