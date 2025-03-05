const User = require("../models/User.js");
const generateTokens = require("../utils/generateToken.js");
const logger = require("../utils/logger.js");
const { validateRegistration } = require("../utils/validation.js");

// user registration
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit...");
  try {
    const { error } = validateRegistration(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {email, password, userName} = req.body;

    let user = await User.findOne({$or : [{email}, {userName}]})
    if(user){
        logger.warn("User already exists...");
        return res.status(400).json({
            success: false,
            message: "User already exists...",
        });
    }

    user = new User({userName, email, password});
    await user.save()

    logger.warn("User saved successfully", user._id);

    const {accessToken, refreshtoken} = await generateTokens(user)

    res.status(201).json({
        success: true,
        message: 'User registration successfully...',
        accessToken,
        refreshtoken
    })

  } catch (error) {
    logger.error('Registration error occured', error);
    res.status(500).json({
        success: false,
        message: 'Some Internal error'
    })
  }
};

// user login

// refresh token

// logout


module.exports = {registerUser}