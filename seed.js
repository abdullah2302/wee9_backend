
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import Product from "./models/Product.js";
import fs from "fs";

dotenv.config();

async function seed() {
    await connectDB();

    const raw = fs.readFileSync("./seed-products.json", "utf-8");
    const products = JSON.parse(raw).map(({ id, ...rest }) => rest); // drop old numeric id, Mongo makes its own

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log(`Seeded ${products.length} products.`);
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});