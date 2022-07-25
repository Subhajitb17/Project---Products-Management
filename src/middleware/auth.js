const jwt = require("jsonwebtoken");    // Importing

//====================================================Authentication Middleware=============================================================//

const authentication= async function(req,res,next){
    try{
     let bearerToken= req.headers.authorization;
     let token = bearerToken.split(" ")[1]
     if (!token) return res.send({ status: false, message: "token must be present" }); 
     jwt.verify(token, "group73-project5",function (err, decoded) {
        if (err) {
             return res.status(401).send({ status: false, err: err.message })
        } else {
            console.log(decoded)
            req.decodedToken=decoded
            next()
        }
    })
    
}
catch(err){
    return res.status(500).send({status:false,message:err.message})
}
}

module.exports = { authentication }     // Exporting 
