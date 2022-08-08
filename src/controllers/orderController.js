const cartModel = require("../models/cartModel")
const orderModel = require("../models/orderModel")
const jwt = require('jsonwebtoken')
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
    const userId = req.params.userId;
    //userId must be a valid objectId
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });

    // Destructuring
    const { orderId, status } = req.body
    //request body mjust not be empty
    if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please enter something!" });

    //orderId validation => orderId is mandatory and must not be empty
    if (!objectValue(orderId)) return res.status(400).send({ status: false, message: "Please provide orderId!" });
    //orderId must be a valid objectId
    if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "Please provide valid orderId!" });

    //DB call => find order details from orderModel by userId and orderId
    const orderOfUser = await orderModel.findOne({ _id: orderId, userId: userId, isDeleted: false })
    //userId not present in the DB
    if (orderOfUser.userId != userId) return res.status(404).send({ status: false, message: `${userId} is not present in the DB!` });
    // order not present in the DB means order not placed yet
    if (!orderOfUser) return res.status(400).send({ status: false, message: "No such order has been placed yet!" });

    //if order status completed or canceled
    if (orderOfUser.status == 'completed' || orderOfUser.status == 'cancled') {
      return res.status(400).send({ status: false, message: "Order already completed or cancelled!" })
    }

    //if cancellable is equal to true
    if (orderOfUser.cancellable === true) {
      //if status completed or cancled
      if (!(['completed', 'cancled'].includes(status))) {
        return res.status(400).send({ status: false, message: "Order status must be either 'Completed' or 'Cancelled'!" });
      }
      //if status is pending
      if (orderOfUser.status == "pending") {
        //DB call and Update => update order details to completed or cancled as requested in the body
        let updateOrder = await orderModel.findOneAndUpdate({ orderId: orderId }, { $set: { status: status } }, { new: true })
        //Successfull upadate order status return response to body
        return res.status(200).send({ status: true, message: "Success", data: updateOrder })
      }
    }

    //if cancellable is equal to false
    if (orderOfUser.cancellable === false) {
      //if status completed
      if (!(['completed'].includes(status))) {
        return res.status(400).send({ status: false, message: "Order status must be 'Completed'!" });
      }
      //if status is pending
      if (orderOfUser.status == "pending") {
        //DB call and Update => update order details to completed as requested in the body
        let updateOrder = await orderModel.findOneAndUpdate({ orderId: orderId }, { $set: { status: status } }, { new: true })
        //Successfull upadate order status return response to body
        return res.status(200).send({ status: true, message: "Success", data: updateOrder })
      }
    }
  }
  catch (error) {
    res.status(500).send({ status: false, data: error.message });
  }
};

// Destructuring & Exporting
module.exports = { createOrder, updateOrder }








