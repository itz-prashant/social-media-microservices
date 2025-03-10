require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middlewares/errorHandler')
const logger = require('./utils/logger')
const {connectionToRabbitMQ, consumeEvent} = require('./utils/rabbitmq')
const searchRoutes = require('./routes/search-route')
const { handlePostCreated, handlePostDeleted } = require('./eventHandlers/create-search-event-handler')

const app = express()
const PORT = process.env.PORT || 3004

mongoose.connect(process.env.MONGODB_URI).then(()=> logger.info("connected to mongodb")).catch((e)=> logger.error("Mongo connection error", e))

const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

app.use('/api/search', searchRoutes)

app.use(errorHandler)

async function startServer() {
    try {
        await connectionToRabbitMQ()
        // consume the event or subscribe the event
        await consumeEvent('post-created', handlePostCreated)
        await consumeEvent('post.deleted', handlePostDeleted)
        app.listen(PORT, () => {
            logger.info(`Search service running on PORT: ${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start log service')
        process.exit(1)
    }
}

startServer()