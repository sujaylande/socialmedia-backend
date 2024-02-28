import express from 'express';
import dotenv from 'dotenv';
import post from './routes/post.js';
import user from './routes/user.js';
import cookieParser from 'cookie-parser';

const app = express();

if(process.env.NODE_ENV !== 'Production'){
dotenv.config({
    path: 'backend/config/config.env'
});
}

//using middlewares
app.use(express.json());
app.use(cookieParser());

//using routes
app.use('/api/v1', post);
app.use('/api/v1', user);

export default app;