const express = require("express")
const route = express.Router();
const {createUser, loginUser, getUserDeatailsById, updateUserDetails} = require("../controllers/userController");
// const productController = require("../controllers/productController");
// const cartController = require("../controllers/cartController");
// const orderController = require("../controllers/orderController");
const {authentication} = require("../middleware/auth")
const aws = require("../aws/s3")


route.post("/register" , createUser)

route.post("/login" , loginUser)

route.get("/user/:userId/profile" , authentication, getUserDeatailsById)

route.put("/user/:userId/profile" , authentication, updateUserDetails)



module.exports = route
