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

async function consumeEvent(routingKey, callback) {
    if(!channel){
        await connectionToRabbitMQ()
    }
    const q = await channel.assertQueue("", {exclusive: true})
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey)
    channel.consume(q.queue, (msg)=>{
        if(msg!==null){
            const content = JSON.parse(msg.content.toString());
            callback(content)
            channel.ack(msg)
        }
    })
    logger.info(`Subscribe to event: ${routingKey}`)
}

module.exports = {connectionToRabbitMQ, publishEVent, consumeEvent};