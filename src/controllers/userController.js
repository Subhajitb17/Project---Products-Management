const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const aws = require("../aws/s3")

const { objectValue, nameRegex, keyValue, mobileRegex, emailRegex, passwordRegex, pincodeRegex, numberValue, isValidObjectId } = require("../middleware/validator"); // IMPORTING VALIDATORS


//--------------------------------------------------- [FIRST API] ------------------------------------------------------------\\


// V = Validator 

const createUser = async (req, res) => {
    try {
        let { fname, lname, email, phone, password, address } = req.body  // Destructuring

        if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide details!" })  // 3rd V used here

        if (!objectValue(fname)) return res.status(400).send({ status: false, message: "Please enter title!" }) // 2nd V used here

        // if (!isValidTitle(fname)) return res.status(400).send({ status: false, message: "Title must be Mr/Mrs/Miss" })  // 5th V used here

        if (!objectValue(lname)) return res.status(400).send({ status: false, message: "Please enter name!" })  // 2nd V used here

        if (!nameRegex(lname)) return res.status(400).send({ status: false, message: "name is invalid!" })  // 4th V used here

        if (!objectValue(phone)) return res.status(400).send({ status: false, message: "Please enter phone number!" })  // 2nd V used here

        if (!mobileRegex(phone)) return res.status(400).send({ status: false, message: "phone number is invalid!" })  // 7th V used here

        let duplicatePhone = await userModel.findOne({ phone })        // DB Call

        if (duplicatePhone) return res.status(400).send({ status: false, message: "phone number is already registered!" }) //Duplicate Validation 

        if (!objectValue(email)) return res.status(400).send({ status: false, message: "Please enter email!" })   // 2nd V used here

        if (!emailRegex(email)) return res.status(400).send({ status: false, message: "email is invalid!" })    // 6th V used here

        let duplicateEmail = await userModel.findOne({ email })

        if (duplicateEmail) return res.status(400).send({ status: false, message: "email is already registered!" })  // Duplicate Validation

        //upload book cover(a file) by aws
        let files = req.files
        let uploadFileURL;
        if (files && files.length > 0) {
            uploadFileURL = await aws.uploadFile(files[0])
        }
        else {
            return res.status(400).send({ status: false, message: "Please add profile image" })
        }
        //aws-url
        let profileImage = uploadFileURL

        if (!objectValue(password)) return res.status(400).send({ status: false, message: "Please enter password!" })  // 2nd V used here

        if (!passwordRegex(password)) return res.status(400).send({ status: false, message: "Password must be 8 to 50 characters!" })                      // 8th V used here

        const passwordHash = await bcrypt.hash(password, 10);
        password = passwordHash

        address = JSON.parse(address)

        if (!objectValue(address)) return res.status(400).send({ status: false, message: "Please enter your address!" })   // 3rd V used here

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

        let users = { fname, lname, email, profileImage, phone, password, address }

        const userCreation = await userModel.create(users)

        res.status(201).send({ status: true, message: 'Success', data: userCreation })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}

//-----------------------------------------------------  [SECOND API]  -------------------------------------------------------\\

const loginUser = async function (req, res) {
    try {
        let { email, password } = req.body  // Destructuring

        if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide email and password!" })  // 3rd V used here

        let user = await userModel.findOne({ email: email })    // DB Call
        if (!user) return res.status(400).send({ status: false, message: "email is not present in the Database!" })

        if (!objectValue(email)) return res.status(400).send({ status: false, message: "email is not present!" })    // Email Validation
        if (!emailRegex(email)) return res.status(400).send({ status: false, message: "email is invalid!" })    // 6th V used here

        if (!objectValue(password)) return res.status(400).send({ status: false, message: "password is not present!" })   // Passsword Validation
        if (!passwordRegex(password)) return res.status(400).send({ status: false, message: "Password must be 8 to 50 characters long!" })                      // 8th V used here

        let passwordCheck = await bcrypt.compare(req.body.password, user.password)
        if (!passwordCheck) return res.status(400).send({ status: false, message: "password is not correct!" })   // Passsword Validation

        if (!user) { return res.status(404).send({ status: false, message: "email or the password is invalid!" }) }


        let token = jwt.sign(                         // JWT Creation
            {
                userId: user._id.toString(),
                group: "seventy-three",                                      // Payload
                project: "ProductsManagement",
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 480 * 60 * 60
            },
            "group73-project5"              // Secret Key 
        )

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

        if (!(fname || lname || email || phone || password || address || profileImage )) return res.status(400).send({ status: false, message: "Please input valid params to update!" });

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
            address = JSON.parse(address)         
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
            { $set: {  fname, lname, email, phone, password, address, profileImage } },
            { new: true }
        );
        return res.status(200).send({ status: true, message: 'Success', data: updatedUserDetails });

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

module.exports = { createUser, loginUser, getUserDeatailsById, updateUserDetails }  // Destructuring & Exporting