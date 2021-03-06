const { db } = require('../utilities/admin');
const { json } = require('express');


exports.getAllPosts = (req,res)=>{
    db.collection('blogs').orderBy('createdAt','desc').get()
    .then((data)=>{
        let getPosts = [];
        data.forEach((doc)=>{
           getPosts.push({
               postId: doc.id,
               userHandle:doc.data().userHandle,
               body:doc.data().body,
               createdAt:doc.data().createdAt,
               userImage:doc.data().userImage,
               likeCount: doc.data().likeCount,
               commentCount: doc.data().commentCount
           });
        });
        return res.json(getPosts);
    }).catch((err)=>console.error(err.code));
}

exports.createPosts = (req,res)=>{
    if (req.body.body.trim() === '' || req.body.body.trim() === undefined) {
        return res.status(400).json({ body: 'Body must not be empty' });
      }
    const pos = {
        body:req.body.body,
        userHandle:req.user.handle,
        userImage: req.user.imageUrl,
        createdAt:new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
        //admin.firestore.Timestamp.fromDate(new Date())
    };
    db.collection('blogs').add(pos).then(doc=>{
        const rPost = pos;
        rPost.postId = doc.id;
        res.json(rPost);
    }).catch(err=>{
        return res.status(500).json({'error': err.code});
    });
}
exports.getPost = (req,res)=>{
    let postData = {};
    db.doc(`/blogs/${req.params.postId}`).get()
    .then((doc)=>{
        if(!doc.exists){
            return res.json({message : 'Post Not Found'});
        }
        postData = doc.data();
        postData.postId = doc.id;
        return db.collection('comments').orderBy('createdAt','desc').where('postId','==',req.params.postId).get();
    }).then((data)=>{
            postData.comments = [];
            data.forEach((doc)=>{
                const commentData = doc.data();
                commentData.commentId = doc.id;
                postData.comments.push(commentData);
            });
            return res.json(postData);
        }).catch(err=>
            {
                return res.status(500).json({'error': err.code});
            });

}

exports.blogComments = (req,res)=>{
    if (req.body.body.trim() === '' || req.body.body.trim() === undefined) {
        return res.status(400).json({ body: 'Body must not be empty' });
      }
    const newComment = {
       body: req.body.body,
       postId: req.params.postId,
       createdAt: new Date().toISOString(),
       userHandle:req.user.handle,
       userImage:req.user.imageUrl
    };
    const postData = db.doc(`/blogs/${req.params.postId}`);
    let postDetails;
    db.doc(`/blogs/${req.params.postId}`).get().then((doc)=>{
        if(!doc.exists){
            return res.json({'error':'Post is not found'});
        }
        postDetails = doc.data();
        return db.collection('comments').add(newComment).then((doc)=>{
            newComment.commentId = doc.id;
        })
    }).then(()=>{
        
        postDetails.commentCount++;
        postData.update({'commentCount': postDetails.commentCount});
        return res.json(newComment);
    }).catch(err=>{
        return res.status(500).json({'error': err.code});
    });
}

exports.commentDelete = (req,res) => {
   const document = db.doc(`/comments/${req.params.commentId}`)
   const postData = db.doc(`/blogs/${req.params.postId}`);
   console.log(req.params.commentId);
   let postDetails; 
   db.doc(`/blogs/${req.params.postId}`).get().then((doc)=>{
    if(!doc.exists){
        console.log(doc)
        return res.json({'error':'Post is not found'});
    }
    console.log("inside post data")
    postDetails = doc.data();
}).catch(err=>{
    console.log("inside post error")
    res.json({'error':'Something went wrong'})
})

db.doc(`/comments/${req.params.commentId}`).get().then((doc)=>{
       if(!doc.exists){
           console.log("inside first if")
            res.status(404).json({'error': 'Comment not found'})
       }else if(doc.data().userHandle !== req.user.handle){
        console.log("inside second if")
           res.status(404).json({'error':'Unauthorized'});
       }else{
           console.log(document);
            return document.delete();
       }
   }).then(()=>{
         console.log("inside count")
         postDetails.commentCount--;
         postData.update({'commentCount': postDetails.commentCount})
         return res.json({'message':'Comment deleted successfully'})
   }).catch(err=>{
       console.log("inside error")
       return res.status(404).json({'error':'Something went wrong'});
   })
}

exports.likeCount = (req,res) =>{
    const likeCounts = db.collection('like').where('postId','==',req.params.postId).where('userHandle','==',req.user.handle).limit(1);
    console.log(req.user);
    const postData = db.doc(`/blogs/${req.params.postId}`);
    let postDetails;
    db.doc(`/blogs/${req.params.postId}`).get().then(doc =>{
        if(doc.exists){
            postDetails = doc.data();
            postDetails.postId = doc.id;
            return likeCounts.get();
        }else{
            return res.json({'error':'Post not found'});
        }
    } ).then(data =>{
        if(data.empty){
            return db.collection('like').add({
                'postId':req.params.postId,
                'userHandle': req.user.handle
    }).then(()=>{
        postDetails.likeCount++;
        return postData.update({'likeCount': postDetails.likeCount});
    }).then(()=>{
        return res.json(postDetails);});
    }else{
        return res.json({'error':'Post already liked'});
    }  
    }).catch(err=>{
        return res.status(500).json({'error':err.code});
    });
}

exports.blogDelete = (req,res)=>{
    const document = db.doc(`/blogs/${req.params.postId}`);
    document.get().then((data)=>{
        console.log(req.user)
        if(!data.exists){
            console.log(req);
            return res.status(404).json({'error':'Post not found'});
        }else if(data.data().userHandle !=  req.user.handle){
            console.log(req.user)
            return res.status(404).json({'general': 'Unauthorized'});
        }else{
            return document.delete();
        }
    }).then(()=>{
        return res.json({'message': 'Deleted successfully'});
    }).catch(err=>{
        return res.status(500).json({'error': 'Something went wrong'});
    });
}


exports.unlikeCount = (req,res) =>{
    const likeCounts = db.collection('like').where('postId','==',req.params.postId).where('userHandle','==',req.user.handle).limit(1);
    const postData = db.doc(`/blogs/${req.params.postId}`);
    let postDetails;
    db.doc(`/blogs/${req.params.postId}`).get().then(doc =>{
        if(doc.exists){
            postDetails = doc.data();
            postDetails.postId = doc.id;
            return likeCounts.get();
        }else{
            return res.json({'error':'Post not found'});
        }
    } ).then(data =>{
        console.log(data.docs);
        if(!data.empty){
            return db.doc(`/like/${data.docs[0].id}`).delete()
    .then(()=>{
        postDetails.likeCount--;
        return postData.update({'likeCount': postDetails.likeCount});
    }).then(()=>{
        return res.json(postDetails);});
    }else{
        return res.json({'error':'Post not liked'});
    }  
    }).catch(err=>{
        return res.status(500).json({'error':err.code});
    });
}


