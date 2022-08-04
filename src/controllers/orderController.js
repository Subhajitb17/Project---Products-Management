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
        if(cartItems.userId !== userId) return res.status(400).send({ status: false, message: `${userId} is not present in the DB!` });
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


// ### orders
// ```yaml
// {
//   "_id": ObjectId("88abc190ef0288abc190ef88"),
//   userId: ObjectId("88abc190ef0288abc190ef02"),
//   items: [{
//     productId: ObjectId("88abc190ef0288abc190ef55"),
//     quantity: 2
//   }, {
//     productId: ObjectId("88abc190ef0288abc190ef60"),
//     quantity: 1
//   }],
//   totalPrice: 50.99,
//   totalItems: 2,
//   totalQuantity: 3,
//   cancellable: true,
//   status: 'pending'
//   createdAt: "2021-09-17T04:25:07.803Z",
//   updatedAt: "2021-09-17T04:25:07.803Z",
// }

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





// const updatedOrder = async function (req, res) {
//     try {
//         data = req.body
//         userId = req.param.userId

//         const { orderId, status } = data

//         //empty body validation

//         if (!validators.isValidBody(data)) { return res.status(400).send({ status: false, message: "Please Provide input in Request Body" }) }

//         // userId validation
//         if(!userId) { return res.status(400).send({ status: false, msg: " please mention userId in params" }) }

//         if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, msg: "Invalid userId in params" }) }

//         const searchUser = await userModel.findOne({ _id: userId });
//         if (!searchUser) { return res.status(400).send({ status: false, message: `user doesn't exists for ${userId}` }) }

//         //orderId validation

//         if (!orderId) return res.status(400).send({ status: false, msg: "please mention order id" })

//         if (!mongoose.isValidObjectId(orderId)) { return res.status(400).send({ status: false, msg: "OrderId is not valid" }) }


//         //verifying does the order belong to user or not.

//         let isOrder = await orderModel.findOne({ userId: userId });
//         if (!isOrder) {
//             return res.status(400).send({ status: false, message: `No such order  belongs to ${userId} ` });
//         }
//         // cancellable validation 

//         if(isOrder.cancellable == false) return res.status(400).send({ status: false, msg: "You can not cancel this order" })
//         if(isOrder.status == "completed") return res.status(400).send({ status: false, msg: "You can not cancel this order now, it is completed" })
//         if(isOrder.status == "cancled") return res.status(400).send({ status: false, msg: "your order is cancled, place order again." })
//         //status validations


//         if (!status) {
//             return res.status(400).send({ status: false, message: " Please enter current status of the order." });
//         }


//         if (!validators.isValidStatus(status)) {
//             return res.status(400).send({status: false, message: "Invalid status in request body. Choose either 'pending','completed', or 'cancelled'."});
//         }
//         if(status == "pending"){ return res.status(400).send({ status: false, message: "Your order is already pending" });}

        
//         let updated = await orderModel.findOneAndUpdate({ _id: orderId }, { status:status }, { new: true })
//         return res.status(200).send({ status: true, message: "update successfull", data: updated })
       
//     } catch (err) {
//         console.log(err)
//         return res.status(500).send({ status: false, message: "Error", error: err.message });
//     }
// }



// const orderUpdate = async (req, res) => {
//     try {
//       let data = req.body;
  
//       //checking for a valid user input
//       if (!isValidRequestBody(data)) {
//         return res.status(400).send({ status: false, message: "Please provide valid request body" });
//     }
  
//       //checking for valid orderId
//       if(!isValid(data.orderId)) return res.status(400).send({ status: false, message: 'OrderId is required and should not be an empty string' });
//       if(!isValidObjectId(data.orderId)) return res.status(400).send({ status: false, message: 'Enter a valid orderId' });
  
//       //checking if cart exists or not
//       let findOrder = await orderModel.findOne({ _id: data.orderId, isDeleted: false });
//       if(!findOrder) return res.status(404).send({ status: false, message: `No order found with this  orderid` })
  
      
//       if(!isValid(data.status)) return res.status(400).send({ status: false, message: 'Status is required and should not be an empty string' });
  
//       //validating if status is in valid format
//       if(!(['Pending','Completed','Cancelled'].includes(data.status))) return res.status(400).send({ status: false, message: "Order status should be one of this 'Pending','Completed' and 'Cancelled'" });
  
//       let conditions = {};
  
//       if(data.status == "Cancelled") {
//         //checking if the order is cancellable or not
//         if(!findOrder.cancellable) return res.status(400).send({ status: false, message: "cancelletion is false:You cannot cancel this order" });
//         conditions.status = data.status;
//       }else{
//         conditions.status = data.status;
//       }
      
//       let orderdata = await orderModel.findByIdAndUpdate(
//         {_id: findOrder._id},
//         conditions,
//         {new: true}
//       )
//       res.status(200).send({ status: true, message: "Order updated Successfully", data: orderdata});
//     } catch (err) {
//       res.status(500).send({ status: false, error: err.message })
//     }
//   }



