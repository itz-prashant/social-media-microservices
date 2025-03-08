const express = require('express')
const { createPost } = require('../controllers/post-controller')
const { authenticateRequest } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(authenticateRequest)

router.post('/create-posts', createPost)

module.exports = router