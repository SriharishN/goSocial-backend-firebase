const { admin,db } = require('./admin');

module.exports = (req,res,next)=>{
    let idTok;
    if(req.headers.authorization){
        idTok = req.headers.authorization;
    }else{
        console.error("No token Found");
        return res.json({error:'Unauthorized'});
    }
    admin.auth().verifyIdToken(idTok).then(decode=>{
        req.user = decode;
        console.log(decode);
        return db.collection('users').where('userId','==',req.user.uid).limit(1).get();
    }).then((data)=>{
        req.user.handle = data.docs[0].data().handle;
        req.user.imageUrl = data.docs[0].data().imageUrl;
        return next();
    }).catch((err) => {
        console.error('Error while verifying token ', err);
        return res.status(403).json(err);
  });
}