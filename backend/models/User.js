import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userShema = mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please enter a name"],
    },

    avatar: {
        public_id: String,
        url: String,
    },

    email: {
        type: String,
        required: [true, "Please enter an email"],
        unique: [true, "Email already exists"],
    },

    password: {
        type: String,
        required: [true, "Please enter a password"],
        minLength: [6, "Password must be at least 6 characters long"],
        select: false,
    },

    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
    ],

    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],

    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],

    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

//this run before save to incript password
userShema.pre("save", async function (next) {
    if (this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
});

userShema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userShema.methods.generateToken = async function () {
    return await jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
}

userShema.methods.getResetPasswordToken = function () {

    const resetToken = crypto.randomBytes(20).toString("hex"); //create reset token

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex"); //hash reset token

    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    return resetToken;
};


export default mongoose.model("User", userShema);