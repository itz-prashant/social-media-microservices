const RefreshToken = require("../models/RefreshToken.js");
const User = require("../models/User.js");
const generateTokens = require("../utils/generateToken.js");
const logger = require("../utils/logger.js");
const { validateRegistration, validateLogin } = require("../utils/validation.js");

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
const loginUser = async(req, res)=>{
  logger.info("Login endpoint hit...");
  try {
    const {error} = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const {email, password} = req.body;
    const user = await User.findOne({email})
    if(!user){
      logger.warn("Invalid user")
      res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    // check user valid password
    const isValidPassword = await user.comparePassword(password)
    if(!isValidPassword){
      logger.warn("Invalid password")
      res.status(400).json({
        success: false,
        message: "Invalid password"
      })
    }

    const {accessToken, refreshtoken} = await generateTokens(user)

    res.json({
      accessToken,
      refreshtoken,
      userID: user._id
    })

  } catch (error) {
    logger.error('Login error occured', error);
    res.status(500).json({
        success: false,
        message: 'Some Internal error'
    })
  }
}

// refresh token
const refreshTokenUser = async(req,res)=>{
  logger.info("Refresh token endpoint hit...")
  try {
    const {refreshToken} = req.body
    if(!refreshToken){
      logger.warn("Refresh token missing ")
      res.status(400).json({
        success: false,
        message: "Refresh token missing "
      })
    }
    const storedToken = await RefreshToken.findOne({token: refreshToken})
    if(!refreshToken || storedToken.expiresAt < new Date()){
      logger.warn("Inavlid or expired refresh token")
      res.status(401).json({
        success: false,
        message: "Inavlid or expired refresh token"
      })
    }
    const user  = await User.findById(storedToken.user)
    if(!user){
      logger.warn("User not found")
      res.status(400).json({
        success: false,
        message: "User not found"
      })
    }

    const {accessToken: newAccessToken, refreshtoken: newRefreshToken} =  await generateTokens(user)

    // delete the old refresh tokrn
    await RefreshToken.deleteOne({_id: storedToken._id})

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    })

  } catch (error) {
    logger.error('Refresh token error occured', error);
    res.status(500).json({
        success: false,
        message: 'Some Internal error'
    })
  }
}

// logout
const logout = async(req, res)=>{
  logger.info("Logout endpoint hit...")
  try {
    const {refreshToken} = req.body
    if(!refreshToken){
      logger.warn("Refresh token missing ")
      res.status(400).json({
        success: false,
        message: "Refresh token missing "
      })
    }
    await RefreshToken.deleteOne({tokrn: refreshToken})
    logger.info("Refresh token deleted for logout")
    res.json({
      success: true,
      message: "Logout successfully"
    })
  } catch (error) {
    logger.error('Loging out error occured', error);
    res.status(500).json({
        success: false,
        message: 'Some Internal error'
    })
  }
}

module.exports = {registerUser, loginUser, refreshTokenUser, logout}