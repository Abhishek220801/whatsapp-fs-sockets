import bcrypt from 'bcrypt'
import User from '../models/user.model.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';

const signup = async (req, res) => {
    try {
        const {username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const foundUser = await User.findOne({username})
        if(foundUser){
            res.status(201).json({message: 'Username already exists'});
        } else {
            const user = new User({username, password: hashedPassword});
            generateTokenAndSetCookie(user._id, res);
            await user.save();
            console.log(user);
            res.status(201).json({message: 'User signed up successfully'});
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message: 'User registration failed.'})
    }
}

export default signup