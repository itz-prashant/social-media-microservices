require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { RedisStore } = require("rate-limit-redis");
const postRoutes = require('./routes/post-routes')
const errorHandler = require('./middlewares/errorHandler')
const logger = require('./utils/logger')
const {connectionToRabbitMQ} = require('./utils/rabbitmq')


const app = express()
const PORT = process.env.PORT || 3002

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

const limiter = rateLimit({
windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "To many request" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
})

app.use('/api/posts/create-post',limiter)

app.use('/api/posts',(req,res, next)=>{
    req.redisClient = redisClient
    next()
} , postRoutes)

app.use(errorHandler)

async function startServer() {
  try{
    await connectionToRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post service running on PORT: ${PORT}`);
  });
  }catch(error){
    logger.error('Falied to conect server', error)
    process.exit(1)
  }
}

 startServer();
  
// Unhandled promise rejection
  
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled rejection at", promise, "reason", reason);
});