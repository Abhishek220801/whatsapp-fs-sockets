import User from "../models/user.model.js"
import bcrypt from "bcrypt"
import generateJWTTokenAndSetCookie from "../utils/generateToken.js";

const signup = async (req, res) => {
    console.log(req.headers["host"]);
    try {
        const {username, password} = req.body;
        const foundUser = await User.findOne({username});
        if(foundUser) {
            return res.status(409).json({message: "Email already registered"});
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({username, password: hashedPassword});
            return res.status(201).json({message: "User registered successfully"});
        }
    } catch(error) {
        console.log('Signup error: ' + error.message);
        return res.status(500).json({message: "User registration failed!"});
    }
}

export const login = async (req, res) => {
    try {
        const {username, password} = req.body;
        const foundUser = await User.findOne({username});
        if(!foundUser) {
            return res.status(401).json({message: "Username does not exist"});
        } else { 
            const passwordMatch = await bcrypt.compare(password, foundUser.password || "");
            if(!passwordMatch) {
                return res.status(401).json({message: "Auth failed"});
            }
            generateJWTTokenAndSetCookie(foundUser._id, res);
            return res.status(200).json({_id: foundUser._id, username: foundUser.username});
        }

    } catch(error) {
        console.log('Login error: ' + error.message);
        return res.status(500).json({message: "Server error"});
    }
}

export default signup;