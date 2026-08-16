import amqp from "amqplib";

let channel;
let connection;

export const connectRabbitMQ = async (onConnect) => {
    let reconnectScheduled = false;
    const scheduleReconnect = () => {
        if (reconnectScheduled) return;
        reconnectScheduled = true;
        setTimeout(() => connectRabbitMQ(onConnect), 5000);
    };

    try {
        if (!process.env.RABBITMQ_URL) {
            throw new Error("RABBITMQ_URL is not defined in environment variables");
        }

        connection = await amqp.connect(process.env.RABBITMQ_URL);

        connection.on("error", (err) => {
            console.error("RabbitMQ connection error", err.message);
            scheduleReconnect();
        });

        connection.on("close", () => {
            console.warn("RabbitMQ connection closed. Reconnecting...");
            scheduleReconnect();
        });

        channel = await connection.createChannel();

        // Assert queues
        if (process.env.RIDER_QUEUE) {
            await channel.assertQueue(process.env.RIDER_QUEUE, { durable: true });
        }

        if (process.env.ORDER_READY_QUEUE) {
            await channel.assertQueue(process.env.ORDER_READY_QUEUE, { durable: true });
        }

        console.log("RabbitMQ Connected Successfully");

        // Re-register consumers on every (re)connect since the channel is new
        await onConnect?.();
    } catch (error) {
        console.error("Failed to connect to RabbitMQ:", error.message);
        scheduleReconnect();
    }
};

export const getChannel = () => {
    if (!channel) {
        console.warn("getChannel called before connection established");
    }
    return channel;
};
