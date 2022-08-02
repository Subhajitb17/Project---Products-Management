const express = require("express")
const route = express.Router();
const {createUser, loginUser, getUserDeatailsById, updateUserDetails} = require("../controllers/userController");
const {createProduct, getProducts, getProductsbyId, updateProduct, deleteProductsbyId} = require("../controllers/productController");
const {createCart, updateCart, getCartDetails, deleteCart} = require("../controllers/cartController");
// const orderController = require("../controllers/orderController");
const {authentication} = require("../middleware/auth")


route.post("/register" , createUser)

route.post("/login" , loginUser)

route.get("/user/:userId/profile" , authentication, getUserDeatailsById)

route.put("/user/:userId/profile" , authentication, updateUserDetails)


route.post("/products" , createProduct)

route.get("/products" , getProducts)

route.get("/products/:productId" , getProductsbyId)

route.put("/products/:productId" , updateProduct)

route.delete("/products/:productId" , deleteProductsbyId)


route.post("/users/:userId/cart" ,authentication, createCart)

route.put("/users/:userId/cart" ,authentication, updateCart)

route.get("/users/:userId/cart" ,authentication, getCartDetails)

route.delete("/users/:userId/cart" ,authentication, deleteCart)


module.exports = route
