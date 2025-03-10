const Post = require("../models/Post");
const logger = require("../utils/logger");
const { publishEVent } = require("../utils/rabbitmq");
const { validateCreatePost } = require("../utils/validation");

async function invaliadtePostCache(req, input) {
  
  const cachedkey = `post:${input}`
  await req.redisClient.del(cachedkey)

  const keys = await req.redisClient.keys("posts:*")
  if(keys.length > 0){
    await req.redisClient.del(keys)
  }
}

const createPost = async (req, res) => {
  logger.info("Created post endpoint hit...");
  try {
    const { error } = validateCreatePost(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();
    await invaliadtePostCache(req, newlyCreatedPost._id.toString())
    logger.info("Post created successfully", newlyCreatedPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

const getAllPost = async (req, res) => {
  logger.info("Get all post endpoint hit...")
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    startIndex = (page - 1 ) * limit;

    const cacheKey = `posts:${page}:${limit}`
    const cachedPosts = await req.redisClient.get(cacheKey)

    if(cachedPosts){
      return res.json(JSON.parse(cachedPosts))
    }

    const posts = await Post.find({}).sort({createdAt: -1}).skip(startIndex).limit(limit)

    const totalNoOfPosts = await Post.countDocuments()

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts/limit),
      totalPosts: totalNoOfPosts
    }

    // save post in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))

    res.json(result)

  } catch (error) {
    logger.error("Error fetching post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
    });
  }
};

const getPost = async (req, res) => {
  logger.info("Get post endpoint hit...")
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`
    const cachedPost = await req.redisClient.get(cacheKey)

    if(cachedPost){
      logger.info('cache available')
      return res.json(JSON.parse(cachedPost))
    }

    const singlePostDetailById = await Post.findById(postId)
    if(!singlePostDetailById){
      return res.status(404).json({
        success: false,
        message: "Post not found"
      })
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePostDetailById))
    res.json(singlePostDetailById)

  } catch (error) {
    logger.error("Error fetching post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
    });
  }
};

const deletePost = async (req, res) => {
  logger.info("Delete post endpoint hit...")
  try {
    const post = await Post.findOneAndDelete({
     _id: req.params.id,
     user: req.user.userId 
    })
    if(!post){
      return res.status(404).json({
        success: false,
        message: "Post not found"
      })
    }
    // Publish post delete method
    await publishEVent('post.deleted', {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaIds: post.mediaIds
    })
    await invaliadtePostCache(req, req.params.id)
    res.json({
      success: true,
      message: 'Post deleted successfully'
    })
  } catch (error) {
    logger.error("Error deleting post", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

module.exports = { createPost, getAllPost , getPost, deletePost};
