import jwt from "jsonwebtoken"

const generateJWTTokenAndSetCookie = (userId, res) => {
    const token = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "15d"
    })
    res.cookie("jwt", token, {
        maxAge: 7*24*60*60*1000, //milliseconds = 7 days 
        httpOnly: true,
        sameSite:"None",
        secure: true,    
    })
 }
 
 export default generateJWTTokenAndSetCookie
 
 
 