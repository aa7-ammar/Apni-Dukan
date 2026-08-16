import axios from "axios";
import { getChannel } from "./rabbitmq.js";
import Rider from "../models/rider.js";

export const startOrderReadyConsumer = async () => {
    const channel = getChannel();
    if (!channel) {
        console.error("RabbitMQ channel not available.");
        return;
    }
    console.log(`Starting consumer: ${process.env.ORDER_READY_QUEUE}`);

    channel.consume(process.env.ORDER_READY_QUEUE, async (msg) => {
        if (!msg) return;
        try {
            const content = msg.content.toString();
            const event = JSON.parse(content);

            if (event.type !== "ORDER_READY_FOR_RIDER") {
                channel.ack(msg);
                return;
            }

            const { orderId, shopId, location, order } = event.data;

            const riders = await Rider.find({
                isAvailable: true,
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: location.coordinates.map(Number)
                        },
                        $maxDistance: 100000, // 100 km
                    }
                }
            });

            if (riders.length === 0) {
                channel.ack(msg);
                return;
            }

            for (const rider of riders) {
                try {
                    await axios.post(`${process.env.REALTIME_SERVICE}/api/v1/internal/emit`, {
                        event: "new-delivery",
                        room: `user:${rider.user}`,
                        payload: order || { _id: orderId, shopId },
                    }, {
                        headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY }
                    });
                } catch (emitError) {
                    console.error(`Emit to rider ${rider.user} failed: ${emitError.message}`);
                }
            }
            channel.ack(msg);
        } catch (error) {
            console.error(`Order-ready consumer error: ${error.message}`);
            channel.ack(msg);
        }
    });
};
