import amqp from "amqplib";

let channel

export const connectRabbitMQ = async (onConnect) => {
    let reconnectScheduled = false;
    const scheduleReconnect = () => {
        if (reconnectScheduled) return;
        reconnectScheduled = true;
        setTimeout(() => connectRabbitMQ(onConnect), 5000);
    };

    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL)
        connection.on("error", (err) => {
            console.error("RabbitMQ connection error:", err.message);
            scheduleReconnect();
        });
        connection.on("close", () => {
            console.warn("RabbitMQ connection closed. Reconnecting...");
            scheduleReconnect();
        });
        channel = await connection.createChannel()
        await channel.assertQueue(process.env.PAYMENT_QUEUE, {
            durable: true,
        })
        await channel.assertQueue(process.env.RIDER_QUEUE, {
            durable: true,
        })
        if (process.env.ORDER_READY_QUEUE) {
            await channel.assertQueue(process.env.ORDER_READY_QUEUE, {
                durable: true,
            })
        }
        console.log("connected to rabbitmq")
        // Re-register consumers on every (re)connect since the channel is new
        await onConnect?.();
    } catch (error) {
        console.error("Failed to connect to RabbitMQ in Shop service:", error.message);
        scheduleReconnect();
    }
}

export const getChannel = () => {
    return channel;
}
