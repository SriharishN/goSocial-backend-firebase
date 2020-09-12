const functions = require('firebase-functions');

const express = require('express');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const { getAllPosts, createPosts, getPost,blogComments, likeCount, unlikeCount } = require('./handlers/posts');
const { signUp,  login, uploadImage, addUserData, getUserDetails, getUserDetail, readNotifications } = require('./handlers/users');
const FBAuths = require('./utilities/auth');

const app = express();
const cors = require('cors');
const { db } = require('./utilities/admin');
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
 app.get('/user/:handle',FBAuths,getUserDetail);
 app.get('/getViews/:postId',getPost);
 app.post('/getViews/:postId/comment',FBAuths,blogComments);
 app.get('/getViews/:postId/like',FBAuths,likeCount);
 app.get('/getViews/:postId/unlike',FBAuths,unlikeCount);
 app.post('/notifications',FBAuths, readNotifications);

 exports.api = functions.region('us-central1').https.onRequest(app);
 
 exports.createNotificationOnLike = functions.region('us-central1').firestore.document('like/{id}').onCreate((snapshot)=>{
  db.doc(`/blogs/${snapshot.data().postId}`).get()
   .then((doc)=>{
     console.log(doc)
     if(doc.exists){
       return db.doc(`/notification/${snapshot.id}`).set({
         createdAt: new Date().toISOString(),
         recipient: doc.data().userHandle,
         sender: snapshot.data().userHandle,
         type: 'like',
         read: false,
         blogId: doc.id
       });
     }
   }).then((val) => {
         console.log(val);
         return;
   }).catch(err=>{
       console.error(err);
       return;
   });
 });
 exports.createNotificationOnComment = functions.region('us-central1').firestore.document('comments/{id}').onCreate((snapshot)=>{
   return db.doc(`/blogs/${snapshot.data().postId}`).get()
   .then((doc)=>{
     if(doc.exists){
       return db.doc(`/notification/${snapshot.id}`).set({
         createdAt: new Date().toISOString(),
         recipient: doc.data().userHandle,
         sender: snapshot.data().userHandle,
         type: 'comment',
         read: false,
         blogId: doc.id
       });
     }
   }).then(() => {
         return;
   }).catch(err=>{
       console.error(err);
       return;
   });
 });
 exports.deleteNotificationOnLike = functions.region('us-central1').firestore.document('like/{id}').onDelete((snapshot)=>{
  return db.doc(`/blogs/${snapshot.data().postId}`).get()
  .then((doc)=>{
    if(doc.exists){
      return db.doc(`/notification/${snapshot.id}`).delete()
    }
  }).then(() => {
        return;
  }).catch(err=>{
      console.error(err);
      return;
  });
});
