import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import router from "./routes/routes.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startOrderReadyConsumer } from "./config/orderReady.consumer.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 5005;

app.get("/", (req, res) => res.json({ service: "rider", status: "ok" }));

app.use("/api", router);

// Bind the port first so the host's health check passes, then connect
// to external services. DB must be up before the consumer starts
// (the consumer uses Mongoose models).
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

(async () => {
    await connectDB();
    await connectRabbitMQ(startOrderReadyConsumer);
})();