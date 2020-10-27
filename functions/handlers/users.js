const { admin,db } = require('../utilities/admin');

const firebase = require('firebase');
const firebaseConfig = require('../utilities/config');



firebase.initializeApp(firebaseConfig);

const{ validateSignUp, validateLogin, reduceUserData } = require('../utilities/validate');

exports.signUp = (req,res)=>{
    let credentials={
        email:req.body.email,
        pass:req.body.pass,
        confirmpass:req.body.confirmpass,
        handle:req.body.handle
    };
    
    const { valid, errors } = validateSignUp(credentials);
    if(!valid) return res.status(400).json(errors);
    let tokens,userId;   

   // let token
db.doc(`/users/${credentials.handle}`).get().then(doc=>{
    if(doc.exists)
    return res.status(400).json({'general':'User already exists'});
});
  
    firebase.auth().createUserWithEmailAndPassword(credentials.email,credentials.pass).then((token)=>{
        userId = token.user.uid;
        return token.user.getIdToken();
    }).then(idToken=>{
        tokens = idToken;
        let userDetails = {
            email:credentials.email,
            password:credentials.pass,
            handle: credentials.handle,
            createdAt: new Date().toISOString(),
            imageUrl:`https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${pic}?alt=media`,
            userId
        };
        db.doc(`/users/${credentials.handle}`).set(userDetails);
    }).then((data)=>{
        return res.json({message:`user created with ${userId}`, tokens });
    }).catch((err)=>{
        res.status(403).json({'general':"Error in Signing Up, Try after sometime"})
    });
    
    }
exports.login = (req,res)=>{
    const users = {
        email:req.body.email,
        pass:req.body.pass
    };
    const { valid, errors } = validateLogin(users);
    if(!valid) return res.status(400).json(errors);
    
         firebase.auth().signInWithEmailAndPassword(users.email,users.pass).then(dat=>{
            return dat.user.getIdToken();
         }).then(idTokens=>{
             return res.json({idTokens});
         }).catch(err=>{
             res.status(403).json({'general': "Wrong Credentials, Try again"});
         });
 }

 
 const pic = 'no-pic.png';
 exports.uploadImage = (req,res)=>{
    const boy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    var busboy = new boy({ headers: req.headers });
    busboy.on('file',(fieldname, file, filename, encoding, mimetype)=>{
        const fileExtension = filename.split('.')[filename.split('.').length-1];
        imageName = `${Math.round(Math.random()*100000000)}.${fileExtension}`;
        const location = path.join(os.tmpdir(),imageName);
        upload = { location, mimetype };
        file.pipe(fs.createWriteStream(location));
    });
    busboy.on('finish',()=>{
        admin.storage().bucket().upload(upload.location,{
            resumable:false,
            metadata: {
                metadata:{
                    contentType: upload.mimetype
                }
            }
        }).then(()=>{
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageName}?alt=media`;
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
        }).then(()=>{
            return res.json({message:'uploaded'});
        }).catch(err=>console.error(err));
    });
    busboy.end(req.rawBody);
}

exports.addUserData = (req, res)=>{
    let userDetails = reduceUserData(req.body);
    db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(()=>{return res.json({message:'User Details Updated Successfully'})
}) .catch(err=>console.error(err));
}
exports.getUserDetails = (req, res) =>{
    let resData = {};
    db.doc(`/users/${req.user.handle}`).get().then((data)=>{
           if(data.exists){
               resData.credentials = data.data();
               return db.collection('like').where('userHandle','==',req.user.handle).get()
           }
    }).then(data=>{
        resData.likes = [];
        data.forEach(res =>{
            resData.likes.push(res.data());
        });
        return db.collection('notification').where('recipient', '==', req.user.handle).orderBy('createdAt','desc').limit(10).get()
    }).then((data)=>{
            resData.notifications = [];
            data.forEach((doc)=>{
                resData.notifications.push({
                    recipient:doc.data().recipient,
                    sender:doc.data().sender,
                    read:doc.data().read,
                    type:doc.data().type,
                    postId:doc.data().blogId,
                    createdAt:doc.data().createdAt,
                    notificationId: doc.id
                })
            })
            return res.json(resData);
    }).catch(err=>{
        return res.status(404).json({error: err.code});
    });
}

exports.getUserDetail = (req,res) => {
    let userData = {};
    db.doc(`users/${req.params.handle}`).get()
    .then(doc =>{
        if(doc.exists){
            userData.user = doc.data();
            return db.collection('blogs').where('userHandle','==',req.params.handle).orderBy('createdAt','desc').get();
        }else{
            return res.status(404).json({'error':'User is not found'});
        }
    }).then(data=>{
        userData.posts = [];
        data.forEach(doc=>{
            userData.posts.push({
                body: doc.data().body,
                createdAt: doc.data().createdAt,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                likeCount: doc.data().likeCount,
                commentCount: doc.data().commentCount,
                blogId: doc.id,
            });
        });
        return res.json(userData);
    }).catch(err=>{
        res.status(500).json({error: err.code});
    });
};

exports.readNotifications = (req,res) =>{
    let batch = db.batch();
    req.body.forEach(notificationId=>{
        const notification = db.doc(`/notification/${notificationId}`);
        batch.update(notification, {read: true});
    });
    batch.commit()
    .then(data=>{
        res.json({message: 'Notification read'});
    }).catch(err=>{
        res.status(500).json({error:err.code});
    });
};
