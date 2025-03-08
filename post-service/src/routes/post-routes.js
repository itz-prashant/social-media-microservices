const express = require('express')
const { createPost , getAllPost, getPost} = require('../controllers/post-controller')
const { authenticateRequest } = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(authenticateRequest)

router.post('/create-posts', createPost)
router.get('/all-posts', getAllPost)
router.get('/:id', getPost)

module.exports = router