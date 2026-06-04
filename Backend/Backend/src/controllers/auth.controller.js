const userModel = require("../models/user.model")
const sessionModel = require("../models/session.model")
const otpModel = require("../models/otp.model")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")
const sendEmail = require("../service/email.service")
const { generateOTP, getOTP } = require("../utils/utils")

async function match(refreshToken, sessions) {
    let matchedSession = null;
    for(const session of sessions){
        const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash)
        if(isMatch){
            matchedSession = session
            break
        }
    }
    if(!matchedSession){
        return null
    }
    else {
        return matchedSession
    }
}

async function verifyEmail(req, res){
    const {email, otp} = req.body
    const pendingRecord = await otpModel.findOne({ email });
    if(!pendingRecord){
        return res.status(400).json({
            "message": "Request expired, email not found"
        })
    }
    const isOtpValid = await bcrypt.compare(otp, pendingRecord.otpHash);
    if(!isOtpValid){
        return res.status(400).json({
            "message": "Invalid/Expired OTP"
        })
    }
    const user = await userModel.create({
        username: pendingRecord.username,
        email: pendingRecord.email,
        password: pendingRecord.passwordHash,
        verified: true
    })
    await otpModel.deleteOne({ _id: pendingRecord._id})
    return res.status(200).json({
        "message": "User Created Successfully"
    })
}

async function registerUser(req, res) {
    const {username, email, password} = req.body
    try {
        const userExists = await userModel.findOne({
            $or: [
                {username},
                {email}
            ]
        })
        if(userExists){
            return res.status(409).json({
                "message": "Username or Email Exists"
            })
        }
        const hashedpw = await bcrypt.hash(password, 10)
        // INSTEAD USING GMAIL OTP BASED VERIFICATION
        // THIS APPROACH IS MANUAL REFRESH TOKEN AND ACCESS TOKEN GENERATION 
        // const refreshToken = jwt.sign({
        //     id: user._id
        // }, 
        // process.env.JWT_SECRET, 
        // {
        //     expiresIn: "7d"
        // })

        // const HashedToken = await bcrypt.hash(refreshToken, 10)
        // const session = await sessionModel.create({
        //     user: user._id,
        //     refreshTokenHash: HashedToken,
        //     ip: req.ip,
        //     userAgent: req.headers["user-agent"],
        // })

        // const accessToken = jwt.sign({
        //     id: user._id,
        //     sessionId: session._id
        // }, 
        // process.env.JWT_SECRET, 
        // {
        //     expiresIn: "15m"
        // })

        // res.cookie("refreshToken", refreshToken, {
        //     httpOnly: true,
        //     secure: true,
        //     sameSite: "strict",
        //     maxAge: 7 * 24 * 60 * 60 * 1000,
        // })
        const otp = generateOTP();
        const html = getOTP(otp);
        const otpHash = await bcrypt.hash(otp, 10);

        await otpModel.deleteMany({ email });
        const otp_entity = await otpModel.create({
            email,
            otpHash,
            username,
            passwordHash: hashedpw,
            createdAt: new Date()
        });

        await sendEmail(
            email,
            "Verify your account",
            "Your OTP code: ",
            html,
        );

        res.status(201).json({
            "message": "OTP Entity Created Successfully",
            "Entity": otp_entity,
            //"token": accessToken,
        })
    } catch (error) {
        console.error("Register error name:", error.name);   // ← log these
        console.error("Register error message:", error.message);
        console.error("Register error stack:", error.stack);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function loginUser(req, res) {
    const {identifier, password} = req.body

    const user = await userModel.findOne({ 
        $or: [
            {username: identifier},
            {email: identifier}
        ]
     })
    // console.log(user)
    // console.log(identifier)
    // console.log("Type:", typeof user?.verified);
    if(!user || !user.verified) {
        return res.status(400).json({
            "message": "Invalid Email or not Verified"
        })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch) {
        return res.status(400).json({"message": "Wrong Password"})
    }
    const refreshToken = jwt.sign({
        id: user._id
    }, 
    process.env.JWT_SECRET, 
    {
        expiresIn: "7d"
    })
    const HashedToken = await bcrypt.hash(refreshToken, 10)
    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash: HashedToken,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
    })

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id
    }, 
    process.env.JWT_SECRET, 
    {
        expiresIn: "15m"
    })

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.status(201).json({
        "message": "Login Successful",
        "user": user,
        "token": accessToken
    })
}

async function getUser(req, res) {
    const token = req.headers.authorization?.split(" ")[ 1 ];
    //const token = req.cookies.token ??
    try{
            if(!token){
                return res.status(401).json({
                    "message": "No Token Present"
                })
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            const user = await userModel.findById(decoded.id);
            return res.status(200).json({
                "message": "User Found !!",
                "user": user
            })
        }
        catch(err) {
            return res.status(401).json({
                "message": "Invalid Token"
            })
        }
}

async function getAccessToken(req, res) {
    const token = req.cookies.refreshToken

    if(!token) {
        return res.status(401).json({
                    "message": "No Token Present"
                })
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET)
    const sessions = await sessionModel.find({
        user: decode.id,
        revoked: false,
    })

    const matchedSession = await match(token, sessions)
    if (!matchedSession) {
        return res.status(400).json({
            "message": "Session Not Found !!"
        });
    }
    const accessToken = jwt.sign({
        id: decode.id
    }, 
    process.env.JWT_SECRET, 
    {
        expiresIn: "15m"
    })
    
    const refreshToken = jwt.sign({
        id: decode.id
    }, 
    process.env.JWT_SECRET, 
    {
        expiresIn: "7d"
    })

    const newRefreshTokenHash = await bcrypt.hash(refreshToken, 10)
    matchedSession.refreshTokenHash = newRefreshTokenHash
    await matchedSession.save()
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
        "message": "Access Token Generated",
        accessToken
    })
}

async function logoutUser(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) {
        return res.status(400).json({
            "message": "Refresh Token Not Found !!"
        })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
    const sessions = await sessionModel.find({
        user: decoded.id,
        revoked: false,
    })
    const matchedSession = await match(refreshToken, sessions)
    if (!matchedSession) {
        return res.status(400).json({
            "message": "Session Not Found !!"
        });
    }

    matchedSession.revoked = true
    await matchedSession.save()

    res.clearCookie("refreshToken")

    return res.status(200).json({
            "message": "Logout Success !!"
        })
}

module.exports = { registerUser, loginUser, getUser, getAccessToken, logoutUser, verifyEmail }