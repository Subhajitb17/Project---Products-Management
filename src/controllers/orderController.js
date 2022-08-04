const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const jwt = require('jsonwebtoken')
const { keyValue, isValidObjectId, objectValue } = require("../middleware/validator");  // IMPORTING VALIDATORS


//----------------------------------------------------  [FOURTHEENTH API]  ------------------------------------------------------------\\


const createOrder = async function (req, res) {
 
    try {
        const {userId} = req.params
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });

        let bearerToken = req.headers.authorization;
        let token = bearerToken.split(" ")[1]
        let decodedToken = jwt.verify(token, "group73-project5")            // Authorization
        if (userId != decodedToken.userId) { return res.status(403).send({ status: false, message: "not authorized!" }) }

        const {cartId, status, cancellable} = req.body
        if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please enter something!" });

        if (!objectValue(cartId)) return res.status(400).send({ status: false, message: "Please provide cartId!" });
        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please provide valid cartId!" });
         
        // let duplicateUserId = await cartModel.findById(userId)
        const cartItems = await cartModel.findOne({_id: cartId, userId: userId ,isDeleted: false})
        if(cartItems.userId != userId) return res.status(400).send({ status: false, message: `${userId} is not present in the DB!` });
        // let cartItems = await cartModel.findOne({_id: cartId, isDeleted: false})
        if(!cartItems) return res.status(400).send({ status: false, message: "Either cart is empty or does not exist!" });

        
        let items = cartItems.items
        let totalQuantity = 0
        for (let i = 0; i<items.length; i++) {
             totalQuantity += items[i].quantity
        }

        if(cancellable){
        if(cancellable !== true || false) {
            return res.status(400).send({ status: false, message: "Cancellable can be either true or false!" });
        }
      }

      if(status){
        if(status !== "pending" || "completed" || "cancled") {
            return res.status(400).send({ status: false, message: "Status can be either pending or completed or cancled!" });
        }
      }

        let order = {userId:userId, items: cartItems.items,  totalPrice: cartItems.totalPrice, totalItems:cartItems.totalItems, totalQuantity:totalQuantity, cancellable: cancellable, status: status}

        let orderCreation = await orderModel.create(order)
        await cartModel.findOneAndUpdate({userId:userId, isDeleted: false}, {$set: {items: [], totalPrice: 0, totalItems:0}} )
        return res.status(201).send({ status: true, message: `Order created successfully`, data: orderCreation });
        

} catch (error) {
    res.status(500).send({ status: false, data: error.message });  
  }
};


//----------------------------------------------------  [FIFTHEENTH API]  ------------------------------------------------------------\\


const updateOrder = async function (req, res) {
 
    try {
        const userId = req.params.userId;
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });
   
        let bearerToken = req.headers.authorization;
        let token = bearerToken.split(" ")[1]
        let decodedToken = jwt.verify(token, "group73-project5")            // Authorization
        if (userId != decodedToken.userId) { return res.status(403).send({ status: false, message: "not authorized!" }) }

        const {orderId, status} = req.body
        if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please enter something!" });

        if (!objectValue(orderId)) return res.status(400).send({ status: false, message: "Please provide orderId!" });
        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "Please provide valid orderId!" });

        const orderOfUser = await orderModel.findOne({_id: orderId, userId: userId ,isDeleted: false})
        if(orderOfUser.userId != userId) return res.status(400).send({ status: false, message: `${userId} is not present in the DB!` });
        if(!orderOfUser) return res.status(400).send({ status: false, message: "No such order has been placed yet!" });
  

       if(orderOfUser.status == 'completed' || orderOfUser.status == 'cancled'){
        return res.status(400).send({status: false, message: "Order already completed or cancelled"})
       }
       
        if(orderOfUser.cancellable === true){
          if(!(['completed','cancled'].includes(status))){
            return res.status(400).send({ status: false, message: "Order status must be either 'Completed' or 'Cancelled'!" });
            }
          if(orderOfUser.status == "pending"){
            let updateOrder = await orderModel.findOneAndUpdate({orderId: orderId}, {$set: {status: status}}, {new: true})
            return res.status(200).send({status: true, message: "Success", data: updateOrder})
          }
        }

        if(orderOfUser.cancellable === false){
          if(!(['completed'].includes(status))){
            return res.status(400).send({ status: false, message: "Order status must be 'Completed'!" });
            }
          if(orderOfUser.status == "pending"){
            let updateOrder = await orderModel.findOneAndUpdate({orderId: orderId}, {$set: {status: status}}, {new: true})
            return res.status(200).send({status: true, message: "Success", data: updateOrder})
          }
        }

} catch (error) {
    res.status(500).send({ status: false, data: error.message });
  }
};


module.exports = { createOrder, updateOrder }  // Destructuring & Exporting








