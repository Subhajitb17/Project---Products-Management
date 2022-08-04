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
        if(orderOfUser.userId !== userId) return res.status(400).send({ status: false, message: `${userId} is not present in the DB!` });
        if(!orderOfUser) return res.status(400).send({ status: false, message: "No such order has been placed yet!" });

       
        if(status !== "completed" || "cancled") return res.status(400).send({ status: false, message: "Status can be either completed or cancled!" });

        else {
            const updatedOrder = await orderModel.findOneAndUpdate(
                { _id: orderId },
                { $set: { status:status } },
                { new: true }
              );

              if (updatedOrder.status == "completed" ) {
                updatedOrder.splice(0,1)
            }
            
              return res.status(200).send({ status: true, message: 'Success', data: updatedOrder });
              
        }

     

        

          

} catch (error) {
    res.status(500).send({ status: false, data: error.message });
  }
};


module.exports = { createOrder, updateOrder }  // Destructuring & Exporting





const updatedOrder = async function (req, res) {
    try {
        data = req.body
        userId = req.param.userId

        const { orderId, status } = data

        //empty body validation

        if (!validators.isValidBody(data)) { return res.status(400).send({ status: false, message: "Please Provide input in Request Body" }) }

        // userId validation
        if(!userId) { return res.status(400).send({ status: false, msg: " please mention userId in params" }) }

        if (!mongoose.isValidObjectId(userId)) { return res.status(400).send({ status: false, msg: "Invalid userId in params" }) }

        const searchUser = await userModel.findOne({ _id: userId });
        if (!searchUser) { return res.status(400).send({ status: false, message: `user doesn't exists for ${userId}` }) }

        //orderId validation

        if (!orderId) return res.status(400).send({ status: false, msg: "please mention order id" })

        if (!mongoose.isValidObjectId(orderId)) { return res.status(400).send({ status: false, msg: "OrderId is not valid" }) }


        //verifying does the order belong to user or not.

        let isOrder = await orderModel.findOne({ userId: userId });
        if (!isOrder) {
            return res.status(400).send({ status: false, message: `No such order  belongs to ${userId} ` });
        }
        // cancellable validation 

        if(isOrder.cancellable == false) return res.status(400).send({ status: false, msg: "You can not cancel this order" })
        if(isOrder.status == "completed") return res.status(400).send({ status: false, msg: "You can not cancel this order now, it is completed" })
        if(isOrder.status == "cancled") return res.status(400).send({ status: false, msg: "your order is cancled, place order again." })
        //status validations


        if (!status) {
            return res.status(400).send({ status: false, message: " Please enter current status of the order." });
        }


        if (!validators.isValidStatus(status)) {
            return res.status(400).send({status: false, message: "Invalid status in request body. Choose either 'pending','completed', or 'cancelled'."});
        }
        if(status == "pending"){ return res.status(400).send({ status: false, message: "Your order is already pending" });}

        
        let updated = await orderModel.findOneAndUpdate({ _id: orderId }, { status:status }, { new: true })
        return res.status(200).send({ status: true, message: "update successfull", data: updated })
       
    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: "Error", error: err.message });
    }
}



const updateCart = async function (req, res) {
    try {
        let data = req.body

        //________________VALIDATIONS________________//

        //empty body validation

        if (!keyValue(data)) { return res.status(400).send({ status: false, message: "Data can't be empty" }) }

        const { cartId, productId, removeProduct } = data

        // CartId Validation

        if (!cartId) return res.status(400).send({ status: false, message: "please mention cartID" })


        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "please mention valid cartID" })

        let cart = await cartModel.findById({ _id: cartId })

        if (!cart) { return res.status(400).send({ status: false, message: "No such cart found" }) }

        if (cart.items.length == 0) { return res.status(400).send({ status: false, message: "nothing to delete in item " }) }

        //productId validation

        if (!productId) return res.status(400).send({ status: false, message: "please mention productID" })

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "please mention valid productID" })

        let product = await productModel.findById({ _id: productId, isDeleted: false })

        if (!product) { return res.status(400).send({ status: false, message: "No such product found in cart " }) }
  
        if (!(removeProduct == 1 || removeProduct == 0)) return res.status(400).send({ status: false, message: "please mention 1 or 0 only in remove product" })



        //***************** if remove product : 1 **************/

        if (removeProduct == 1) {

            var pro = cart.items                                             // items array

            for (let i = 0; i < pro.length; i++) {

                if (pro[i].productId == productId) {

                    let dec = pro[i].quantity - 1                            // decreasing quantity of product -1

                    pro[i].quantity = dec

                    var cTotalPrice = cart.totalPrice - product.price;       // updated total price

                    if (pro[i].quantity == 0) {
                        pro.splice(i, 1)
                        var ded = cart.totalItems - 1
                        var cTotalItems = ded                               // only  if item quantity will become zero, totalItems 
                    }                                                        // will -1

                    break;

                }
                return pro                                                   // it will return item array  after changes
            }

            if (pro.length == 0) { cTotalPrice = 0; cTotalItems = 0 };        // if there will be no item in cart 

            let updated = await cartModel.findOneAndUpdate({ _id: cartId }, { items: pro, totalPrice: cTotalPrice, totalItems: cTotalItems }, { new: true })

            return res.status(200).send({ status: true, message: "update successfull", data: updated })

        }

        //**************** if remove product : 0 ** **************/

        if (removeProduct == 0) {

            var pro = cart.items                                                             // array of items

            for (let i = 0; i < pro.length; i++) {

                if (pro[i].productId == productId)

                    var cTotalPrice = cart.totalPrice - (product.price * pro[i].quantity)      //deducting products price from total pr


                var cTotalItems = cart.totalItems - 1                            // decreasing totalItems quantity by 1

                pro.splice(i, 1)                                                  // deleting product from items array

                break;
            }

        }
        if (pro.length == 0) { cTotalPrice = 0; cTotalItems = 0 };             // if items array will become empty

        let updated = await cartModel.findOneAndUpdate({ _id: cartId }, { items: pro, totalPrice: cTotalPrice, totalItems: cTotalItems }, { new: true })                                                         // updated

        return res.status(200).send({ status: true, message: "update successfull", data: updated })
    }

    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: "Error", error: err.message })

    }


}