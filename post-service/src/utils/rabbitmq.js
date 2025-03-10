const amqp = require("amqplib")
const logger = require("../utils/logger")

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events'

async function connectionToRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL)
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, 'topic', {durable: false});
        logger.info("Connected to rabbitmq")
        return channel;
    } catch (error) {
        logger.warn('Error connecting to rabbitmq', error)
    }
}

async function publishEVent(routingKey, message) {
    if(!channel){
        await connectionToRabbitMQ()
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
    logger.info('Event publish:', routingKey)
}

module.exports = {connectionToRabbitMQ, publishEVent};