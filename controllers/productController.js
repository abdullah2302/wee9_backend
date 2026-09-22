import Product from "../models/Product.js";

// @route GET /api/products
export async function getProducts(req, res, next) {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit, 10) || 12, 1),
            48
        );
        const search = String(req.query.search || "").trim();
        const category = String(req.query.category || "").trim();
        const match = {};

        if (search) {
        
            match.$text = { $search: search };
        }

        if (category && category !== "All") {
            match.category = category;
        }


        const [categories, [result]] = await Promise.all([
            Product.distinct("category"),
            Product.aggregate([
                { $match: match },
                {
                    $facet: {
                        products: [
                            { $sort: { createdAt: -1 } },
                            { $skip: (page - 1) * limit },
                            { $limit: limit },
                        ],
                        metadata: [{ $count: "total" }],
                    },
                },
            ]),
        ]);

        const total = result.metadata[0]?.total || 0;
        res.json({
            products: result.products,
            categories: categories.sort(),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
}

// @route GET /api/products/:id
export async function getProductById(req, res, next) {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
}

// @route POST /api/products  (protected)
export async function createProduct(req, res, next) {
    try {
        const { name, category, price, description, image, inStock, stockQuantity } = req.body;

        if (!name || !category || price === undefined) {
            res.status(400);
            throw new Error("name, category and price are required");
        }

        const product = await Product.create({
            name,
            category,
            price,
            description,
            image,
            inStock,
            stockQuantity,
        });

        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
}

// @route DELETE /api/products/:id  (protected)
export async function deleteProduct(req, res, next) {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }
        res.json({ message: "Product removed" });
    } catch (err) {
        next(err);
    }
}

export async function updateProduct(req, res, next) {
    try {
        const { name, category, price, description, image, inStock, stockQuantity } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { name, category, price, description, image, inStock, stockQuantity },
            { new: true, runValidators: true }
        );

        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }

        res.json(product);
    } catch (err) {
        next(err);
    }
}