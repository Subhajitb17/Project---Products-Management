const jwt = require("jsonwebtoken");    // Importing JWT
const userModel = require("../models/userModel");     // Importing User Model
const { isValidObjectId } = require("../middleware/validator");  // IMPORTING VALIDATORS


//=================================================   [MIDDLEWARES]  ===========================================================//


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////       AUTHENTICATION       //////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const authentication = async function (req, res, next) {
    try {
        ///request bearer token from header for authorization
        let bearerToken = req.headers.authorization;
        let token
        try {
            //split barer token
            token = bearerToken.split(" ")
        }
        catch (err) {
            return res.status(401).send({ message: "token is missing!" })
        }
        //if token not present
        if (!token) {
            return res.send({ status: false, message: "token must be present" });
        }
        //decoded token verify with secrect key
        jwt.verify(token[1], "group73-project5", function (err, decoded) {
            if (err) {
                return res.status(401).send({ status: false, err: err.message })
            }
            else {
                req.decodedToken = decoded
                next()
            }
        })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////       AUTORISATION        ///////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const authorisation= async function(req,res,next){
    try {
        // request decodedToken
        const decodedToken = req.decodedToken

        //request userId from path params
        const userId = req.params.userId
        //userId required
        if(!userId){
            return res.status(400).send({status:false,message:"userId is required in the request paramaters!"})
        }
        //userId must be a valid objectId
        if(!isValidObjectId(userId)){
            return res.status(401).send({status:false,message:"not a valid userId!"})
        }

        //DB Call => find by userId from userModel
        const userFound = await userModel.findOne({ _id: userId })
        //user not found in DB
        if (!userFound) {
            return res.status(404).send({ status: false, message: `User does not exists!` })
        }
        
        // check => requested userId with userId from decodedtoken
        if(decodedToken.userId!=userId){
            return res.status(403).send({status:false,message:"you are not authorised!"})
        }
        next()
        
    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}



// Exporting 
module.exports = { authentication, authorisation }     
