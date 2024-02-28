import User from '../models/User.js';
import Post from '../models/Post.js';
import sendEmail from '../middlewares/sendEmail.js';
import crypto from 'crypto';

const register = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'User already exists'
                });
        }

        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: 'sample_id',
                url: 'sample_url'
            }
        });

        //regiser plus login
        const token = await user.generateToken();

        res.status(201).cookie("token", token, {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //30 days
            httpOnly: true
        }).json({
            success: true,
            user,
            token
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const login = async (req, res) => {

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'User not found!'
                });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Incorrect password'
                });
        }

        const token = await user.generateToken();

        res.status(200).cookie("token", token, {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //30 days
            httpOnly: true
        }).json({
            success: true,
            user,
            token
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const logout = async (req, res) => {

    try {
        res.cookie("token", "", { //set token to empty string
            expires: new Date(Date.now()), 
            httpOnly: true
        }).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const updatePassword = async (req, res) => {
    
        try {
            const user = await User.findById(req.user._id).select('+password');

            const {oldPassword, newPassword} = req.body;

            if(!oldPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Please enter old and new password'
                });
            }
    
            const isMatch = await user.matchPassword(oldPassword);
    
            if (!isMatch) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: 'Incorrect old password'
                    });
            }
    
            user.password = newPassword;
            await user.save();
    
            res.status(200).json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    };

const updateProfile = async (req, res) => {

    try {
        const user = await User.findById(req.user._id);

        const { name, email } = req.body;

        if (name) {
            user.name = name;
        }
        if(email) {
            user.email = email;
        }
        await user.save();
        //if (req.body.avatar) 
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};



const followUser = async (req, res) => {

    try {

        const userToFollow = await User.findById(req.params.id); //gives id of user to follow
        const loggedInUser = await User.findById(req.user._id);

        if (!userToFollow) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: 'User not found!'
                });
        }

        if (loggedInUser.following.includes(userToFollow._id)) { //if already following
            //aaplya following madhun user kadun takla
            const indexFollowing = loggedInUser.following.indexOf(userToFollow._id); //get index of user to unfollow
            loggedInUser.following.splice(indexFollowing, 1); //remove user from following array

            //smorchacha follower mdun swatala kadun takla
            const indexFollower = userToFollow.followers.indexOf(loggedInUser._id);
            userToFollow.followers.splice(indexFollower, 1);

            await loggedInUser.save(); //save to db
            await userToFollow.save();

            res.status(200).json({
                success: true,
                message: 'User unfollowed successfully'
            });
        } else {

            loggedInUser.following.push(userToFollow._id);
            userToFollow.followers.push(loggedInUser._id);

            await loggedInUser.save(); //save to db
            await userToFollow.save();

            res.status(200).json({
                success: true,
                message: 'User followed successfully'
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

/* 
const userid = req.user._id;
const followerLen = user.followers.length;

for(let i=0; i<followerLen; i++) {
    const otherFollowing = await User.findById(user.followers[i]);
    const index = otherFollowing.following.indexOf(userid);
    otherFollowing.following.splice(index, 1);
    await otherFollowing.save();
}


*/


const deleteMyProfile = async (req, res) => {

    try {
        const user = await User.findById(req.user._id);

        const postsLen = user.posts.length;

        const followers = user.followers;
        const following = user.following;
        const userId = user._id;

        await user.deleteOne();

        //log out user after removing profile othewise app will crash
        res.cookie("token", "", { //set token to empty string
            expires: new Date(Date.now()), 
            httpOnly: true
        });

        //delete all posts of user
        for(let i=0; i<postsLen; i++) {
            await Post.findByIdAndDelete(user.posts[i]);
        }

        //removing user from followers following list
        for(let i=0; i<followers.length; i++) {
            const follower = await User.findById(followers[i]);
            const index = follower.following.indexOf(userId);
            follower.following.splice(index, 1);
            await follower.save();
        }

        //removing user from followings followers list
        for(let i=0; i<following.length; i++) {
            const followed = await User.findById(following[i]);
            const index = followed.followers.indexOf(userId);
            followed.followers.splice(index, 1);
            await followed.save();
        }

        res.status(200).json({
            success: true,
            message: 'Profile deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const myProfile = async (req, res) => {

    try{
        const user = await User.findById(req.user._id).populate("posts");
        res.status(200).json({
            success: true,
            user,
        });
    } catch(error){
        res.status(500).json({
            success: false,
            massage: error.message,
        });
    }
}

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate("posts");

        if (!user) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: 'User not found!'
                });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            success: true,
            users
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const resetPasswordToken = user.getResetPasswordToken(); //generate token we make changes in user
        await user.save();

        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/password/reset/${resetPasswordToken}`;
        const message = `Your password reset token is as follows: \n\n${resetUrl}`; //send this message to user via mail

        try{
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message
            });

            res.status(200).json({
                success: true,
                message: `Email sent to: ${user.email}`
            });
        }catch(err){
            user.resetPasswordToken = undefined; //fail to send mail
            user.resetPasswordExpire = undefined;

            await user.save();

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent'
            });
        }

    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

const resetPassword = async (req, res) => {
    try{
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: {$gt: Date.now()},
        });

        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Invalid o Expired token'
            });
        }
        user.password = req.body.password;

        if(!req.body.password){
            return res.status(400).json({
                success: false,
                message: 'Please enter a new password'
            });
        }

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password Updated"
        })
    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

export { register, login, logout, updatePassword, updateProfile, followUser, deleteMyProfile, myProfile, getUserProfile, getAllUsers, forgotPassword, resetPassword};
