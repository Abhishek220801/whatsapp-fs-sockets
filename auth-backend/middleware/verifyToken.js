import jwt from "jsonwebtoken"

const verifyToken = (req, res, next) => {
    const token = req.cookies.jwt;
    console.log(token);
    if(!token) {
        return res.status(401).json({message: 'Unauthorized: Token not provided'});
    };

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if(!decodedToken) return res.status(401).json({message: 'Unauthorized: Invalid Token'});
        console.log(decodedToken);
        next();
    } catch (error) {
        console.log(error.message);
    }
}

export default verifyToken;