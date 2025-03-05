const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const RefreshToken = require('../models/RefreshToken')


const generateTokens = async(user)=>{
    const accessToken = jwt.sign({
        userId: user._id,
        userName: user.userName
    }, process.env.JWT_SECRET, {expiresIn: '60m'})

    const refreshtoken = crypto.randomBytes(40).toString('hex')
    const expiresAt  = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7) // refresh token expire in 7 days

    await RefreshToken.create({
        token: refreshtoken,
        user: user._id,
        expiresAt,
    })

    return {accessToken, refreshtoken}
}

module.exports = generateTokens;