import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import connectDB from "./src/config/db.js";

import router from "./src/routes/shop.route.js";
import itemRouter from "./src/routes/Item.route.js";
import cartRouter from "./src/routes/cart.route.js";
import addressRouter from "./src/routes/address.js";
import orderRouter from "./src/routes/order.js";

import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import { startPaymentConsumer } from "./src/controllers/payment.consumer.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended:true
}));

const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => res.json({ service: "shop", status: "ok" }));

app.use("/api/shop", router);

app.use("/api/item", itemRouter);

app.use("/api/cart", cartRouter);

app.use("/api/address", addressRouter);

app.use("/api/order", orderRouter);

// Multer rejects an unexpected file field by calling next(err), which without
// this handler falls through to Express's default and returns an opaque 500.
app.use((err, req, res, next) => {
    console.error(`${req.method} ${req.originalUrl} error:`, err);

    if (err.name === "MulterError") {
        return res.status(400).json({ message: `upload error: ${err.message}` });
    }

    res.status(500).json({ message: err.message || "internal server error" });
});

// Bind the port first so the host's health check passes, then connect
// to external services (mongoose buffers queries until connected).
app.listen(PORT, () => {
    console.log(`Shop service running on port ${PORT}`);
});

connectDB();

connectRabbitMQ(startPaymentConsumer);