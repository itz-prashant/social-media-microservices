require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middlewares/errorHandler')
const logger = require('./utils/logger')

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