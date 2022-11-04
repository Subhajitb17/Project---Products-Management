const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const userModel = require("../models/userModel");
const { keyValue, isValidObjectId, objectValue } = require("../middleware/validator");  // IMPORTING VALIDATORS


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////       CREATE      ORDER         API       ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const createOrder = async function (req, res) {
  try {
    //request userId from path params
    const { userId } = req.params
    //userId must be a valid objectId
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });

    // Destructuring
    const { cartId, status, cancellable } = req.body
    //request body must not be empty
    if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please enter something!" });

    //cartId validation => cartId is mandatory and must not be empty
    if (!objectValue(cartId)) return res.status(400).send({ status: false, message: "Please provide cartId!" });
    //cartId must be a valid objectId
    if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please provide valid cartId!" });

    //DB call => find cart details from cartModel by userId and cartId
    const cartItems = await cartModel.findOne({ _id: cartId, userId: userId, isDeleted: false })
    //userId not present in the DB
    if (cartItems.userId != userId) return res.status(404).send({ status: false, message: `${userId} is not present in the DB!` });
    // cart not present in the DB or empty
    if (!cartItems) return res.status(400).send({ status: false, message: "Either cart is empty or does not exist!" });

    //products quantity update
    let items = cartItems.items
    let totalQuantity = 0
    for (let i = 0; i < items.length; i++) {
      totalQuantity += items[i].quantity
    }
    // cancellable validation => if key is present value must not be empty
    if (cancellable) {
      //cancellable must be true or false
      if (cancellable !== true || false) {
        return res.status(400).send({ status: false, message: "Cancellable can be either true or false!" });
      }
    }

    // status validation => if key is present value must not be empty
    if (status) {
      //status must be pending or completed or canceled
      if (status !== "pending" || "completed" || "cancled") {
        return res.status(400).send({ status: false, message: "Status can be either pending or completed or cancled!" });
      }
    }

    // Destructuring
    let order = { userId: userId, items: cartItems.items, totalPrice: cartItems.totalPrice, totalItems: cartItems.totalItems, totalQuantity: totalQuantity, cancellable: cancellable, status: status }

    //Create order for the user and store in DB
    let orderCreation = await orderModel.create(order)
    //update cart on successfully complition of order and set cart as empty
    await cartModel.findOneAndUpdate({ userId: userId, isDeleted: false }, { $set: { items: [], totalPrice: 0, totalItems: 0 } })
    //Successfull oreder details return response to body
    return res.status(201).send({ status: true, message: `Order created successfully`, data: orderCreation });
  }
  catch (error) {
    res.status(500).send({ status: false, data: error.message });
  }
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////       UPDATE      ORDER         API       ///////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateOrder = async function (req, res) {
  try {
    //request userId from path params
    let userId = req.params.userId.trim()
    //userId must be a valid objectId
    if (!isValidObjectId(orderId)) {
      return res.status(400).send({ status: false, message: `${orderId} not a object id` })
    }

    // Destructuring
    let { orderId, status } = req.body

    // 
    if (req.body.cancellable) {
      return res.status(400).send({ status: false, message: "this feature(cancellable ) is not available right now" })
    }

    //DB Call => find by userId from userModel
    let userCheck = await userModel.findOne({ _id: userId })
    //user not found in DB
    if (!userCheck) {
      return res.status(404).send({ status: false, message: "user id doesn't exist" })
    }

    //DB Call => find by orderId from orderModel
    let orderCheck = await orderModel.findOne({ _id: orderId })
    //Order not found
    if (!orderCheck) {
      return res.status(404).send({ status: false, message: "order is not created " })
    }
    //check userId from order same with the login user or not 
    if (orderCheck.userId.toString() !== userCheck._id.toString()) {
      return res.status(404).send({ status: false, message: `order is not for ${userId}, you cannot order it  ` })
    }

    // order is cancelable => false
    if (orderCheck.cancellable == false) {
      //order can not be canceled
      if (status == "canceled") {
        return res.status(400).send({ status: false, message: `you cannot canceled this order ` })
      }
      //order must be complete => only option for the "cancelable -- false" order
      if (status != "completed") {
        return res.status(400).send({ status: false, message: `this order can only be completed` })
      }
    }
    //order status => completed
    else if (orderCheck.status == "completed") {
      //completed order can not be panding again
      if (status == "pending") {
        return res.status(400).send({ status: false, message: "this can only be completed !!cannot make it pending" })
      }
      //completed order can not be canceled
      if (status == "canceled") {
        return res.status(400).send({ status: false, message: "this can only be completed !!cannot make it canceled" })
      }
    }
    //oder status => canceled
    else if (orderCheck.status == "canceled") {
      // canceled order status can not be changed further
      if (status != "canceled") {
        return res.status(400).send({ status: false, message: "this has canceled please create a oreder" })
      }
    }
    // order status => complete or canceled (when cancelabled as true)
    else {
      let sts = ["completed", "canceled"]
      if (sts.includes(status) == false) {
        return res.status(400).send({ status: false, message: "this can only be completed or canceled" })
      }
    }

    // check status of order from orderModel
    orderCheck.status = status
    // is Deleted must be Boolean => deleted or not deleted 
    if (req.body.isDeleted == Boolean) {
      // request isDeleted value from request body
      orderCheck.isDeleted = req.body.isDeleted
      // if isDeleted => true
      if (req.body.isDeleted == true) {
        // create the deleted time and date
        orderCheck.deletedAt = new Date.now()
      }
    }

    //DB call and Update => update order details by requested body parameters 
    let updateOrder = await orderModel.findByIdAndUpdate({ _id: orderId }, orderCheck, { new: true })

    // using spread operator and toObject property => copy all the updated data to a object
    updateOrder = { ...updateOrder.toObject() }

    //map => returns the key, value pair in the same order as inserted.
    updateOrder.items.map(x => delete x._id)
    //Successfull upadte user details return response to body
    res.status(200).send({ status: true, message: "Success", data: updateOrder })
  }
  catch (error) {
    res.status(500).send({ status: false, message: error.message })
    console.log(error)
  }

}

// Destructuring & Exporting
module.exports = { createOrder, updateOrder }

