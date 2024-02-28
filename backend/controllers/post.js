import Post from '../models/Post.js';
import User from '../models/User.js';

const createPost = async (req, res) => {

    try {
        const newPostData = {
            caption: req.body.caption,
            image: {
                public_id: 'sample_id',
                url: 'sample_url'
            },
            owner: req.user._id
        }


        const post = await Post.create(newPostData);

        const user = await User.findById(req.user._id);
        //console.log(user);

        user.posts.push(post._id);

        await user.save();

        res.status(201).json({
            success: true,
            post
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


const deletePost = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if(post.owner.toString() !== req.user._id.toString()){ //check if the post belongs to the user
            return res.status(401).json({
                success: false,
                message: 'You are not authorized to delete this post'
            });
        }

        await post.deleteOne(); //remove is deprecated and no need to give id

        const user = await User.findById(req.user._id);

        const index = user.posts.indexOf(req.params.id);

        user.posts.splice(index, 1);

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Post deleted'
        });
    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const likeAndUnlikePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.likes.includes(req.user._id)) { //delete like from array
            const index = post.likes.indexOf(req.user._id);
            post.likes.splice(index, 1);
            await post.save();

            return res.status(200).json({
                success: true,
                message: 'Post unliked'
            });
        } else {
            post.likes.push(req.user._id);
            await post.save();

            return res.status(200).json({
                success: true,
                message: 'Post liked'
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }

};

//aple jala follow krto tyache post pahayche ahe
const getPostOfFollowing = async (req, res) => {

    try{
        const user = await User.findById(req.user._id); //logged in user apn swata chi id ahe he

        const posts = await Post.find({ //database mdhlya sarv post vr ja 
            owner:{                     //tya post cha ower 
                $in: user.following,   //apn jala follow krto to jr asel tr te post dakhva
            }
        })

        res.status(200).json({
            success: true,
            posts
        });

    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const updateCaption = async (req, res) => {

    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if(post.owner.toString() !== req.user._id.toString()){ //check if the post belongs to the user
            return res.status(404).json({
                success: false,
                message: 'You are not authorized to update this post'
            });
        }

        post.caption = req.body.caption;

        await post.save();

        res.status(200).json({
            success: true,
            message: 'Post updated'
        });
    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

const commentOnPost = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        let commentIndex = -1;

        //cheack if the comment already exists

        post.comments.forEach((item, index) => {
            if(item.user.toString() === req.user._id.toString()){
                commentIndex = index;
            }
        });

        if(commentIndex !== -1){
            post.comments[commentIndex].comment = req.body.comment;

            await post.save();

            return res.status(200).json({
                success: true,
                message: 'Comment updated'
            });
        }else {
            post.comments.push({
                user: req.user._id,
                comment: req.body.comment,
            });
        }

        await post.save();

        res.status(200).json({
            success: true,
            message: 'Comment added'
        });
    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

const deleteComment = async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.stutus(404).json({
                success: false,
                message: "Post not found"
            });
        }

        //cheak if post's owner want to delete
        if(post.owner.toString() === req.user._id.toString() ){
            if(req.body.commentId == undefined){
                return res.status(404).json({
                    success: false,
                    message: "Comment Id is required",
                });
            }

            post.comments.forEach((item, index) => {
                if(item._id.toString() === req.body.commentId.toString()){
                    return post.comments.splice(index, 1);
                }
            });

            await post.save();

            return res.status(200).json({
                success: true,
                message: "Selected comment has deleted"
            });
        }else{
            //cheak if the comment belongs to the user
            post.comments.forEach((item, index) => {
                if(item.user.toString() === req.user._id.toString()){
                    return post.comments.splice(index, 1);
                }
            });

            await post.save();

            return res.status(200).json({
                success: true,
                message: "Your comment has been deleted"
            });
        }
    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

export { createPost, deletePost, likeAndUnlikePost, getPostOfFollowing, updateCaption, commentOnPost, deleteComment };