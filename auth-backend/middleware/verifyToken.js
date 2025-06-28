import jwt from 'jsonwebtoken'

const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;
    if(!token){
        return res.status(401).json({message: "Unauthorized: Token not provided"});
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decodedToken);
        next();
    } catch (error) {
        console.log(error.message);
    }
}

export default verifyToken;