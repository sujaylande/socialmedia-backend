import express from 'express';
import { commentOnPost, createPost, deleteComment, deletePost, getPostOfFollowing, likeAndUnlikePost, updateCaption } from '../controllers/post.js';
import isAuthenticated from '../middlewares/auth.js';

const router = express.Router();

router.route('/post/upload').post(isAuthenticated, createPost);

router.route('/post/:id')
.get(isAuthenticated, likeAndUnlikePost)
.put(isAuthenticated, updateCaption)
.delete(isAuthenticated, deletePost);

router.route('/posts').get(isAuthenticated, getPostOfFollowing);

router.route('/post/comment/:id')
.put(isAuthenticated, commentOnPost)
.delete(isAuthenticated, deleteComment);




export default router;