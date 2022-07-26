const express = require("express")
const route = express.Router();
const userController = require("../controllers/userController");
const productController = require("../controllers/productController");
const cartController = require("../controllers/cartController");
// const orderController = require("../controllers/orderController");
const middleware = require("../middleware/auth")
const aws = require("../aws/s3")


route.post("/register" , userController.createUser)

route.post("/login" , userController.loginUser)



module.exports = route
