const functions = require('firebase-functions');

const express = require('express');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const { getAllPosts, createPosts, getPost,blogComments, likeCount, unlikeCount, blogDelete, commentDelete } = require('./handlers/posts');
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
 app.get('/user/:handle',getUserDetail);
 app.get('/getViews/:postId',getPost);
 app.post('/getViews/:postId/comment',FBAuths,blogComments);
 app.get('/getViews/:postId/like',FBAuths,likeCount);
 app.get('/getViews/:postId/unlike',FBAuths,unlikeCount);
 app.post('/notifications',FBAuths, readNotifications);
 app.delete('/getViews/:postId',FBAuths, blogDelete);
 app.delete('/getViews/:postId/comment/:commentId',FBAuths, commentDelete);

 exports.api = functions.region('us-central1').https.onRequest(app);
 
 exports.createNotificationOnLike = functions.region('us-central1').firestore.document('like/{id}').onCreate((snapshot)=>{
  return db.doc(`/blogs/${snapshot.data().postId}`).get()
   .then((doc)=>{
     if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
       return db.doc(`/notification/${snapshot.id}`).set({
         createdAt: new Date().toISOString(),
         recipient: doc.data().userHandle,
         sender: snapshot.data().userHandle,
         type: 'like',
         read: false,
         postId: doc.id
       });
     }
   }).catch(err=>{
       console.error(err);
       return;
   });
 });
 exports.createNotificationOnComment = functions.region('us-central1').firestore.document('comments/{id}').onCreate((snapshot)=>{
   return db.doc(`/blogs/${snapshot.data().postId}`).get()
   .then((doc)=>{
     if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
       return db.doc(`/notification/${snapshot.id}`).set({
         createdAt: new Date().toISOString(),
         recipient: doc.data().userHandle,
         sender: snapshot.data().userHandle,
         type: 'comment',
         read: false,
         postId: doc.id
       });
     }
   }).catch(err=>{
       console.error(err);
       return;
   });
 });
 exports.deleteNotificationOnLike = functions.region('us-central1').firestore.document('like/{id}').onDelete((snapshot)=>{
  return db.doc(`/blogs/${snapshot.data().postId}`).get()
  .then((doc)=>{

      return db.doc(`/notification/${snapshot.id}`).delete()

  }).catch(err=>{
      console.error(err);
      return;
  });
});
exports.deleteOnPosts = functions.region('us-central1').firestore.document('blogs/{postId}').onDelete((snapshot,context)=>{
  const batch = db.batch();
  const postId = context.params.postId;
  return db.collection('like').where('postId','==',postId).get()
  .then(doc=>{
    doc.forEach(data=>{
      batch.delete(db.doc(`like/${data.id}`));
    });
    return db.collection('comments').where('postId','==', postId).get();
  })
    .then(doc=>{
      doc.forEach(data=>{
        batch.delete(db.doc(`comments/${data.id}`));
      })
      return db.collection('notification').where('blogId','==',postId).get()
    })
      .then(doc=>{
        doc.forEach(data=>{
          batch.delete(db.doc(`notification/${data.id}`));
        })
        batch.commit();
      }).catch(err=>{
        console.log(err);
      })
   
});

exports.onUpdateImage = functions.region('us-central1').firestore.document('users/{userId}').onUpdate((snapshot)=>{
    const before = snapshot.before.data();
    const after = snapshot.after.data();
    if(before != after){
      const batch = db.batch();
      return db.collection('blogs').where('userHandle','==',before.handle).get()
      .then((data)=>{
        data.forEach(doc=>{
          const post = db.doc(`/blogs/${doc.id}`);
          batch.update(post, {userImage : after.imageUrl});
        });
        batch.commit();
      });
    }else {
      return true;
    }
});