const userModel = require("../models/userModel");
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt")
const aws = require("../aws/s3")

const { objectValue, nameRegex, keyValue, isValidTitle, mobileRegex, emailRegex, passwordRegex, pincodeRegex, numberValue } = require("../middleware/validator"); // IMPORTING VALIDATORS


//-------------------------------------------------------  FIRST API -----------------------------------------------------------------\\


// V = Validator 

const createUser = async (req, res) => {
    try {

        let { fname, lname, email, phone, password, address } = req.body  // Destructuring

        if (!keyValue(req.body)) return res.status(400).send({ status: false, msg: "Please provide details!" })  // 3rd V used here

        if (!objectValue(fname)) return res.status(400).send({ status: false, msg: "Please enter title!" }) // 2nd V used here

        // if (!isValidTitle(fname)) return res.status(400).send({ status: false, msg: "Title must be Mr/Mrs/Miss" })  // 5th V used here

        if (!objectValue(lname)) return res.status(400).send({ status: false, msg: "Please enter name!" })  // 2nd V used here

        if (!nameRegex(lname)) return res.status(400).send({ status: false, msg: "name is invalid!" })  // 4th V used here

        if (!objectValue(phone)) return res.status(400).send({ status: false, msg: "Please enter phone number!" })  // 2nd V used here

        if (!mobileRegex(phone)) return res.status(400).send({ status: false, msg: "phone number is invalid!" })  // 7th V used here

        let duplicatePhone = await userModel.findOne({ phone })        // DB Call

        if (duplicatePhone) return res.status(400).send({ status: false, msg: "phone number is already registered!" }) //Duplicate Validation 

        if (!objectValue(email)) return res.status(400).send({ status: false, msg: "Please enter email!" })   // 2nd V used here

        if (!emailRegex(email)) return res.status(400).send({ status: false, msg: "email is invalid!" })    // 6th V used here

        let duplicateEmail = await userModel.findOne({ email })

        if (duplicateEmail) return res.status(400).send({ status: false, msg: "email is already registered!" })  // Duplicate Validation

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
   
        if (!objectValue(password)) return res.status(400).send({ status: false, msg: "Please enter password!" })  // 2nd V used here

        if (!passwordRegex(password)) return res.status(400).send({ status: false, msg: "Password must be 8 to 15 characters long and must be in alphabets and numbers!" })                      // 8th V used here

         const passwordHash = await bcrypt.hash(password, 10);
         req.body.password = passwordHash
          
     req.body.address = JSON.parse(req.body.address)

      if(address) {

         if (!keyValue(address)) return res.status(400).send({ status: false, msg: "Please enter your address!" })   // 3rd V used here

        if (!objectValue(address.shipping)) return res.status(400).send({ status: false, msg: "Please enter your shipping address!" })   // 3rd V used here

        if (req.body.address.shipping.street) {
            if (!objectValue(req.body.address.street)) return res.status(400).send({ status: false, msg: "Please enter your street!" }) // 2nd V used here
        }

        if (req.body.address.shipping.city) {
            if (!objectValue(req.body.address.city)) return res.status(400).send({ status: false, msg: "Please enter your city!" })
            // 2nd V used above
        }

        if (req.body.address.shipping.pincode) {
            if (!numberValue(req.body.address.pincode)) return res.status(400).send({ status: false, msg: "Please enter your pincode!" })
            // 15th V used above
        }

        if (req.body.address.shipping.pincode) {
            if (!pincodeRegex(req.body.address.pincode)) return res.status(400).send({ status: false, msg: "pincode is invalid!" })
            // 9th V used above

            if (!objectValue(address.billing)) return res.status(400).send({ status: false, msg: "Please enter billing your address!" })   // 3rd V used here

            if (req.body.address.billing.street) {
                if (!objectValue(req.body.address.street)) return res.status(400).send({ status: false, msg: "Please enter your street!" }) // 2nd V used here
            }

            if (req.body.address.billing.city) {
                if (!objectValue(req.body.address.city)) return res.status(400).send({ status: false, msg: "Please enter your city!" })
                // 2nd V used above
            }

            if (req.body.address.billing.pincode) {
                if (!numberValue(req.body.address.pincode)) return res.status(400).send({ status: false, msg: "Please enter your pincode!" })
                // 15th V used above
            }

            if (req.body.address.billing.pincode) {
                if (!pincodeRegex(req.body.address.pincode)) return res.status(400).send({ status: false, msg: "pincode is invalid!" })
                // 9th V used above
            }
        }

        }

        let users = {fname, lname, email, profileImage, phone, password, address}

        const userCreation = await userModel.create(users)

        res.status(201).send({ status: true, message: 'Success', data: userCreation })
    }
    catch (error) {
        res.status(500).send({ status: false, msg: error.message })
    }

}

//-------------------------------------------------------  SECOND API  ---------------------------------------------------------------------\\

const loginUser = async function (req, res) {
    try {
        let { email, password } = req.body  // Destructuring

        if (!keyValue(req.body)) return res.status(400).send({ status: false, msg: "Please provide email and password!" })  // 3rd V used here

        if (!objectValue(email)) return res.status(400).send({ status: false, msg: "email is not present!" })    // Email Validation
        if (!emailRegex(email)) return res.status(400).send({ status: false, msg: "email is invalid!" })    // 6th V used here

        if (!objectValue(password)) return res.status(400).send({ status: false, msg: "password is not present!" })   // Passsword Validation
        if (!passwordRegex(password)) return res.status(400).send({ status: false, msg: "Password must be 8 to 15 characters long and must be in alphabets and numbers!" })                      // 8th V used here

        let user = await userModel.findOne({ email: email, password: password })    // DB Call

        let passwordCheck = await bcrypt.compare(req.body.password, user.password)
        if (!passwordCheck) return res.status(400).send({ status: false, msg: "password is not correct!" })   // Passsword Validation

        if (!user) { return res.status(404).send({ status: false, msg: "email or the password is invalid!" }) }


        let token = jwt.sign(                         // JWT Creation
            {
                userId: user._id.toString(),
                group: "seventy-three",                                      // Payload
                project: "ProductsManagement",
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 48 * 60 * 60
            },
            "group73-project5"              // Secret Key 
        )

        return res.status(201).send({ status: true, data: user._id, token })
    }
    catch (err) {
        console.log("This is the error:", err.message)
        return res.status(500).send({ status: false, msg: err.message })
    }
}

module.exports = { createUser, loginUser }  // Destructuring & Exporting