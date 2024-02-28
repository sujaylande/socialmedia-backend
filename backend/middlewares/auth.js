import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const isAuthenticated = async (req, res, next) => {

   try{
    const {token} = req.cookies;
    
    //console.log(token);

    if(!token) {
        return res.status(401).json({message: 'Please login first'});
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

   // console.log(decoded);
    //console.log(decoded._id);

    req.user = await User.findById(decoded._id);

    //console.log(req.user);

    next();
   }catch(err){
    res.status(500).json({
        success: false,
        message: err.message
    });
   }
};

export default isAuthenticated;

