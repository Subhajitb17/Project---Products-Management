const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const aws = require("../aws/s3")

const { objectValue, nameRegex, keyValue, mobileRegex, emailRegex, passwordRegex, pincodeRegex, numberValue, isValidObjectId } = require("../middleware/validator"); // IMPORTING VALIDATORS



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////       CREATE    USER     API      //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createUser = async (req, res) => {
    try {
        let { fname, lname, email, phone, password, address } = req.body  // Destructuring

        // Request body validation => empty or not
        if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide details!" })

        //first name validation => first name is mandatory
        if (!objectValue(fname)) return res.status(400).send({ status: false, message: "Please enter first name!" })
        //first name must be in alphabate
        if (!nameRegex(fname)) return res.status(400).send({ status: false, message: "first name is invalid!" })

        //last name validation => last name is mandatory
        if (!objectValue(lname)) return res.status(400).send({ status: false, message: "Please enter last name!" })
        //last name must  be in alphabate
        if (!nameRegex(lname)) return res.status(400).send({ status: false, message: "last name is invalid!" })

        //Email validation => Email is mandatory
        if (!objectValue(email)) return res.status(400).send({ status: false, message: "Please enter email!" })
        //Email must be a valid email address 
        if (!emailRegex(email)) return res.status(400).send({ status: false, message: "email is invalid!" })
        // Email must be unique => checking from DB that email already registered or not
        let duplicateEmail = await userModel.findOne({ email })
        if (duplicateEmail) return res.status(400).send({ status: false, message: "email is already registered!" })

        //upload Profile Image(a file) by aws in S3
        let files = req.files
        let uploadFileURL;
        if (files && files.length > 0) {
            uploadFileURL = await aws.uploadFile(files[0])
        }
        else {
            return res.status(400).send({ status: false, message: "Please add profile image" })
        }
        //aws-url of S3
        let profileImage = uploadFileURL

        //phone number validation => phone is number mandatory
        if (!objectValue(phone)) return res.status(400).send({ status: false, message: "Please enter phone number!" })
        //phone number must be a valid indian phone number
        if (!mobileRegex(phone)) return res.status(400).send({ status: false, message: "phone number is invalid!" })
        //phone must must be unique => checking from DB that phone number already registered or not
        let duplicatePhone = await userModel.findOne({ phone })
        if (duplicatePhone) return res.status(400).send({ status: false, message: "phone number is already registered!" })

        //Password validation => password is mandatory
        if (!objectValue(password)) return res.status(400).send({ status: false, message: "Please enter password!" })
        //Password must be 8-50 characters 
        if (!passwordRegex(password)) return res.status(400).send({ status: false, message: "Password must be 8 to 50 characters and only alphabates and number only!" })
        //creating hash password by using bcrypt
        const passwordHash = await bcrypt.hash(password, 10);
        password = passwordHash

        // address pincode validation => should not start with "0"
        try { address = JSON.parse(address) }
        catch (err) { return res.status(400).send({ status: false, message: "Pincode should not start with 0!" }) }

        //Address validation => address is mandatory
        if (!objectValue(address)) return res.status(400).send({ status: false, message: "Please enter your address!" })
        //shipping address is mandatory
        if (!objectValue(address.shipping)) return res.status(400).send({ status: false, message: "Please enter your shipping address!" })
        // shipping address street is mandatory
        if (address.shipping.street) {
            if (!objectValue(address.shipping.street)) return res.status(400).send({ status: false, message: "Please enter your street!" })
        }
        // shipping address city is mandatory
        if (address.shipping.city) {
            if (!objectValue(address.shipping.city)) return res.status(400).send({ status: false, message: "Please enter your city!" })
        }
        // shipping address Pincode is mandatory
        if (address.shipping.pincode) {
            if (!numberValue(address.shipping.pincode || address.shipping.pincode === "")) return res.status(400).send({ status: false, message: "Please enter your pincode!" })
        }
        //Pincode only contaion number and must have length equal to 6
        if (address.shipping.pincode) {
            if (!pincodeRegex(address.shipping.pincode || address.shipping.pincode === "")) return res.status(400).send({ status: false, message: "pincode is invalid!" })
        }

        // Billing address street is mandatory
        if (!objectValue(address.billing)) return res.status(400).send({ status: false, message: "Please enter billing your address!" })
        // Billing address street is mandatory
        if (address.billing.street) {
            if (!objectValue(address.billing.street)) return res.status(400).send({ status: false, message: "Please enter your street!" })
        }
        // Billing address city is mandatory
        if (address.billing.city) {
            if (!objectValue(address.billing.city)) return res.status(400).send({ status: false, message: "Please enter your city!" })
        }
        // Billing address Pincode is mandatory
        if (address.billing.pincode || address.billing.pincode === "") {
            if (!numberValue(address.billing.pincode)) return res.status(400).send({ status: false, message: "Please enter your pincode!" })
        }
        //Pincode only contaion number and must have length equal to 6
        if (address.billing.pincode || address.billing.pincode === "") {
            if (!pincodeRegex(address.billing.pincode)) return res.status(400).send({ status: false, message: "pincode is invalid!" })
        }

        let users = { fname, lname, email, profileImage, phone, password, address } // Destructuring

        //Create user and store in DB
        const userCreation = await userModel.create(users)
        //successfull creation of a new user response
        res.status(201).send({ status: true, message: 'Success', data: userCreation })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////       LOGIN    USER     API       //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const loginUser = async function (req, res) {
    try {
        let { email, password } = req.body  // Destructuring

        // Request body validation => empty or not
        if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide email and password!" })

        //Email is mandatory for login
        if (!objectValue(email)) return res.status(400).send({ status: false, message: "email is not present!" })
        //Email must be a valid email address
        if (!emailRegex(email)) return res.status(400).send({ status: false, message: "email is invalid!" })

        //Password validation => Password is mandatory for login
        if (!objectValue(password)) return res.status(400).send({ status: false, message: "password is not present!" })
        //Password must be 8-50 characters 
        if (!passwordRegex(password)) return res.status(400).send({ status: false, message: "Password must be 8 to 50 characters longa and only alphabates and number only!" })                      // 8th V used here
        
        //Email Validation => checking from DB that email present in DB or not
        let user = await userModel.findOne({ email: email })
        if (!user) return res.status(400).send({ status: false, message: "email is not present in the Database!" })

        //password check by comparing request body password and the password from bcrypt hash password
        let passwordCheck = await bcrypt.compare(req.body.password, user.password)
        //request body password and bcrypt hash password not match
        if (!passwordCheck) return res.status(400).send({ status: false, message: "password is not correct!" })
        
        //Bad Request => Email or password is invalid 
        if (!user) { return res.status(404).send({ status: false, message: "email or the password is invalid!" }) }

        //Create Token by jsonwebtoken
        let token = jwt.sign(
            {
                //Payload
                userId: user._id.toString(),
                group: "seventy-three",
                project: "ProductsManagement",
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 480 * 60 * 60
            },
            "group73-project5"              // Secret Key 
        )

        //for successfull login return response userId with generated token to body
        return res.status(201).send({ status: true, data: { userId: user._id, token } })
    }
    catch (err) {
        console.log("This is the error:", err.message)
        return res.status(500).send({ status: false, message: err.message })
    }
}

//-----------------------------------------------------  [THIRD API]  -------------------------------------------------------\\

const getUserDeatailsById = async (req, res) => {

    try {
        const userId = req.params.userId

        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "userId is invalid!" }) }    // 1st V used here

        let bearerToken = req.headers.authorization;
        let token = bearerToken.split(" ")[1]
        let decodedToken = jwt.verify(token, "group73-project5")            // Authorization
        if (userId != decodedToken.userId) { return res.status(403).send({ status: false, message: "not authorized!" }) }

        let findUsersbyId = await userModel.findOne({ _id: userId })    // DB Call
        if (!findUsersbyId) { return res.status(404).send({ status: false, message: "User details not found or does not exist!" }) }   // DB Validation

        res.status(200).send({ status: true, data: findUsersbyId })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}


//----------------------------------------------------  [FOURTH API]  ------------------------------------------------------\\

const updateUserDetails = async function (req, res) {
    try {
        const userId = req.params.userId;

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid!" })   // 1st V used here

        let bearerToken = req.headers.authorization;
        let token = bearerToken.split(" ")[1]
        let decodedToken = jwt.verify(token, "group73-project5")            // Authorization
        if (userId != decodedToken.userId) { return res.status(403).send({ status: false, message: "not authorized!" }) }

        let findUsersbyId = await userModel.findOne({ _id: userId })    // DB Call
        if (!findUsersbyId) { return res.status(404).send({ status: false, message: "User details not found or does not exist!" }) }   // DB Validation

        let { address, fname, lname, email, phone, password, profileImage } = req.body;  // Destructuring


        // if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide something to update!" }); // 3rd V used here
        //the above validation not neeeded

        // let profileImage

        // if(profileImage){ 
        //upload book cover(a file) by aws
        let files = req.files
        let uploadFileURL;
        if (files && files.length > 0) {
            uploadFileURL = await aws.uploadFile(files[0])
            profileImage = uploadFileURL
        }
        //aws-url

        if (!(fname || lname || email || phone || password || address || profileImage)) return res.status(400).send({ status: false, message: "Please input valid params to update!" });

        if (fname) {       // Nested If used here
            if (!objectValue(fname)) return res.status(400).send({ status: false, message: "Please enter first name!" })
        }        // 2nd V used above

        if (lname) {       // Nested If used here
            if (!objectValue(lname)) return res.status(400).send({ status: false, message: "Please enter last name!" })
        }        // 2nd V used above

        if (email) {          // Nested If used here
            if (!objectValue(email)) return res.status(400).send({ status: false, msg: "Please enter email!" }) // 2nd V used here   
            if (!emailRegex(email)) return res.status(400).send({ status: false, message: "email is invalid!" })    // 6th V used here        
            let duplicateEmail = await userModel.findOne({ email })
            if (duplicateEmail) return res.status(400).send({ status: false, message: "email is already in use!" })    // Duplicate Validation
        }

        if (phone) {          // Nested If used here
            if (!objectValue(phone)) return res.status(400).send({ status: false, msg: "Please enter email!" }) // 2nd V used here
            if (!mobileRegex(phone)) return res.status(400).send({ status: false, message: "phone number is invalid!" })
            // 7th V used above
            let duplicatePhone = await userModel.findOne({ phone })
            if (duplicatePhone) return res.status(400).send({ status: false, message: "Phone number is already in use!" })    // Duplicate Validation
        }


        if (password) {
            if (!objectValue(password)) return res.status(400).send({ status: false, message: "Please enter password!" })  // 2nd V used here
            if (!passwordRegex(password)) return res.status(400).send({ status: false, message: "Password must be 8 to 50 characters!" })                      // 8th V used here

            const passwordHash = await bcrypt.hash(password, 10);
            password = passwordHash
        }



        if (address) {                              // Nested If used here
            try { address = JSON.parse(address) }
            catch (err) { return res.status(400).send({ status: false, message: "Pincode should not start from 0!" }) }
            if (!objectValue(address)) return res.status(400).send({ status: false, message: "Please enter address!" })
            // 2nd V used above

            if (address.shipping) {
                if (!objectValue(address.shipping)) return res.status(400).send({ status: false, message: "Please enter your shipping address!" })   // 3rd V used here

                if (address.shipping.street) {
                    if (!objectValue(address.shipping.street)) return res.status(400).send({ status: false, message: "Please enter your street!" }) // 2nd V used here
                }

                if (address.shipping.city) {
                    if (!objectValue(address.shipping.city)) return res.status(400).send({ status: false, message: "Please enter your city!" })
                    // 2nd V used above
                }

                if (address.shipping.pincode) {
                    if (!numberValue(address.shipping.pincode || address.shipping.pincode === "")) return res.status(400).send({ status: false, message: "Please enter your pincode!" })
                    // 15th V used above
                }

                if (address.shipping.pincode) {
                    if (!pincodeRegex(address.shipping.pincode || address.shipping.pincode === "")) return res.status(400).send({ status: false, message: "pincode is invalid!" })
                    // 9th V used above
                }
            }

            if (address.billing) {
                if (!objectValue(address.billing)) return res.status(400).send({ status: false, message: "Please enter billing your address!" })   // 3rd V used here

                if (address.billing.street) {
                    if (!objectValue(address.billing.street)) return res.status(400).send({ status: false, message: "Please enter your street!" }) // 2nd V used here
                }

                if (address.billing.city) {
                    if (!objectValue(address.billing.city)) return res.status(400).send({ status: false, message: "Please enter your city!" })
                    // 2nd V used above
                }

                if (address.billing.pincode || address.billing.pincode === "") {
                    if (!numberValue(address.billing.pincode)) return res.status(400).send({ status: false, message: "Please enter your pincode!" })
                    // 15th V used above
                }

                if (address.billing.pincode || address.billing.pincode === "") {
                    if (!pincodeRegex(address.billing.pincode)) return res.status(400).send({ status: false, message: "pincode is invalid!" })
                    // 9th V used above
                }
            }
        }

        const updatedUserDetails = await userModel.findOneAndUpdate(
            { _id: userId },
            { $set: { fname, lname, email, phone, password, address, profileImage } },
            { new: true }
        );
        return res.status(200).send({ status: true, message: 'Success', data: updatedUserDetails });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

module.exports = { createUser, loginUser, getUserDeatailsById, updateUserDetails }  // Destructuring & Exporting