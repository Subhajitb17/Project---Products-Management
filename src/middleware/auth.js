const jwt = require("jsonwebtoken");    // Importing

//==============================================Authentication Middleware====================================================//

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

// Exporting 
module.exports = { authentication }     
