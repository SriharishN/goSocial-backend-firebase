const isEmpty = (string)=>{
    if(string.trim() === '') return true
    else return false
}
const isEmail = (string)=>{
    var pat =  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(string.match(pat)) return true
    else return false
}

exports.validateSignUp = (data) => {
 let errors = {};
   
if(isEmpty(data.email))
errors.email = 'Mail Should not be empty';
else if(!isEmail(data.email))
errors.email = 'Enter valid mail id';

if(isEmpty(data.pass)) 
errors.pass = 'Must not be empty';

if(isEmpty(data.confirmpass)) 
errors.confirmpass = 'Must not be empty';

if(data.pass != data.confirmpass) 
errors.confirmpass = 'Password not a match';

if(isEmpty(data.handle)) 
errors.handle = 'Not be empty';

return {
    errors,
    valid : Object.keys(errors).length === 0 ? true:false
}

}
exports.validateLogin = (data) =>{
    let errors = {};
   
    if(isEmpty(data.email))
    errors.email = 'Mail Should not be empty';
    else if(!isEmail(data.email))
    errors.email = 'Enter valid mail id';
   
    if(isEmpty(data.pass)) 
    errors.pass = 'Must not be empty';

     return {
         errors,
         valid : Object.keys(errors).length === 0 ? true:false
     }    
}
exports.reduceUserData=(data)=>{
   let userDetails ={};
   if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
   else
   userDetails.bio = '';
   if(!isEmpty(data.website.trim()) && data.website.trim().substring(0,4) !== 'http')
             userDetails.website = `http://${data.website}`;
   else if(isEmpty(data.website)) userDetails.website = '';
   else userDetails.website = data.website;           
   if(!isEmpty(data.location.trim()))
          userDetails.location = data.location;
   else
          userDetails.location = '';  
   return userDetails;       
}