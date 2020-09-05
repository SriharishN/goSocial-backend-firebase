const functions = require('firebase-functions');

const express = require('express');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const { getAllPosts, createPosts, getPost,blogComments, likeCount, unlikeCount } = require('./handlers/posts');
const { signUp,  login, uploadImage, addUserData, getUserDetails } = require('./handlers/users');
const FBAuths = require('./utilities/auth');

const app = express();
const cors = require('cors');
app.use(cors())


app.post('/helloWorld',(request, response) => {
  response.send("Hello from Firebase!");
 });
 
 
 app.get('/getViews', getAllPosts);
 app.post('/newPost',FBAuths,createPosts);
 app.post('/signUp',signUp);
 app.post('/login',login);
 app.post('/user/image',FBAuths,uploadImage);
 app.post('/user',FBAuths,addUserData);
 app.get('/user',FBAuths,getUserDetails);
 app.get('/getViews/:postId',getPost);
 app.post('/getViews/:postId/comment',FBAuths,blogComments);
 app.get('/getViews/:postId/like',FBAuths,likeCount);
 app.get('/getViews/:postId/unlike',FBAuths,unlikeCount);

 exports.api = functions.region('us-central1').https.onRequest(app);