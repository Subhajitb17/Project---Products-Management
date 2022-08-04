const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const jwt = require('jsonwebtoken')
const { keyValue, objectValue, isValidObjectId, validQuantity } = require("../middleware/validator");  // IMPORTING VALIDATORS


//-----------------------------------------------------  [TENTH API]  --------------------------------------------------------------\\

// V = Validator 

//---------------Create Cart--------------//

const createCart = async function (req, res) {

  try {
    const userId = req.params.userId;
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id!" });

    let { quantity, productId, cartId } = req.body;

    let bearerToken = req.headers.authorization;
    let token = bearerToken.split(" ")[1]
    let decodedToken = jwt.verify(token, "group73-project5")            // Authorization
    if (userId != decodedToken.userId) { return res.status(403).send({ status: false, message: "not authorized!" }) }

    //-----------Request Body Validation---------//

    if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide valid request body!" });

    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please provide valid Product Id!" });

    if (!quantity) {
      quantity = 1;

    } else {
      if (!validQuantity(quantity)) return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero!" });

    }
    //---------Find User by Id--------------//

    const findUser = await userModel.findById({ _id: userId });

    if (!findUser) {
      return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}!` });
    }

    const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

    if (!findProduct) {
      return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}!` });
    }
    //----------Find Cart By Id----------//
    if (cartId) {
      if (!isValidObjectId(cartId)) {
        return res.status(400).send({ status: false, message: "Please provide valid cartId!" });
      }

      let duplicateCart = await cartModel.findOne({ _id: cartId, isDeleted: false })

      if (!duplicateCart) {
        return res.status(400).send({ status: false, message: "cartId doesn't exists!" })
      }
    }

    const findCartOfUser = await cartModel.findOne({ userId: userId, isDeleted: false });

    //------------Create New Cart------------//

    if (!findCartOfUser) {

      let cartData = {
        userId: userId,
        items: [
          {
            productId: productId,
            quantity: quantity,
          },
        ],
        totalPrice: findProduct.price * quantity,
        totalItems: 1,
      };

      const createCart = await cartModel.create(cartData);
      return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
    }
    //--------Check Poduct Id Present In Cart-----------//

    if (findCartOfUser) {

      let price = findCartOfUser.totalPrice + quantity * findProduct.price;

      let arr = findCartOfUser.items;

      for (i in arr) {
        if (arr[i].productId.toString() === productId) {
          arr[i].quantity += quantity;
          let updatedCart = {
            items: arr,
            totalPrice: price,
            totalItems: arr.length,
          };
          //-------------Update Cart---------------------//

          let responseData = await cartModel.findOneAndUpdate(
            { _id: findCartOfUser._id },
            updatedCart,
            { new: true }
          );
          return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });

        }
      }
      //---------Add Item & Update Cart----------//

      arr.push({ productId: productId, quantity: quantity });

      let updatedCart = {
        items: arr,
        totalPrice: price,
        totalItems: arr.length,
      };

      let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });
      return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
    }

  } catch (error) {
    res.status(500).send({ status: false, data: error.message });
  }
};

//------------------------------------------------------  [ELEVENTH API]  -----------------------------------------------------------\\

const updateCart = async function (req, res) {
  try {
    const userId = req.params.userId;

    let bearerToken = req.headers.authorization;
    let token = bearerToken.split(" ")[1]
    let decodedToken = jwt.verify(token, "group73-project5")            // Authorization
    if (userId != decodedToken.userId) { return res.status(403).send({ status: false, message: "not authorized!" }) }

    const { cartId, productId, removeProduct } = req.body
    if (!keyValue(req.body)) { return res.status(400).send({ status: false, message: "Please provide something to update!" }) }


    // CartId Validation

    if (!objectValue(cartId)) return res.status(400).send({ status: false, message: "Please enter cartId!" })
    if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please enter valid cartId!" })

    let cart = await cartModel.findById({ _id: cartId })
    if (!cart) { return res.status(400).send({ status: false, message: "Cart does not exist in the DB! " }) }

    if (cart.items.length == 0) { return res.status(400).send({ status: false, message: "Nothing left to delete!" }) }

    //productId validation

    if (!productId) return res.status(400).send({ status: false, message: "Please enter productId!" })

    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId!" })

    let product = await productModel.findById({ _id: productId, isDeleted: false })

    if (!product) { return res.status(400).send({ status: false, message: "Product not found in the Cart!" }) }

    if (!(removeProduct == 1 || removeProduct == 0)) return res.status(400).send({ status: false, message: "please mention 1 or 0 only in remove product" })

    //****** if remove product : 1 *****/
    let cartItems
    let productQuantity
    let productItems
    let allPrice
    let allItems

    if (removeProduct == 1) {

      cartItems = cart.items
      // items array
      for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].productId == productId) {
          productQuantity = cartItems[i].quantity - 1                            // decreasing quantity of product -1
          cartItems[i].quantity = productQuantity
          allPrice = cart.totalPrice - product.price;       // updated total price

          if (cartItems[i].quantity == 0) {
            cartItems.splice(i, 1)
            productItems = cart.totalItems - 1
            allItems = productItems                               // only  if item quantity will become zero, totalItems 
          }                                                        // will -1
          break;
        }
        return cartItems                                                   // it will return item array  after changes
      }
      if (cartItems.length == 0) { allPrice = 0; allItems = 0 };        // if there will be no item in cart 

      let updatedProduct = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartItems, totalPrice: allPrice, totalItems: allItems }, { new: true })

      return res.status(200).send({ status: true, message: "Success", data: updatedProduct })

    }

    //****** if remove product : 0 * *****/

    if (removeProduct == 0) {

      cartItems = cart.items
      // array of items
      for (let i = 0; i < cartItems.length; i++) {
        if (cartItems[i].productId == productId) {
          allPrice = cart.totalPrice - (product.price * cartItems[i].quantity)      //deducting products price from total pr
          allItems = cart.totalItems - 1                            // decreasing totalItems quantity by 1
          cartItems.splice(i, 1)                                                  // deleting product from items array
          break;
        }
      }

    }
    if (cartItems.length == 0) { allPrice = 0; allItems = 0 };             // if items array will become empty

    let updatedProduct = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cartItems, totalPrice: allPrice, totalItems: allItems }, { new: true })                                                         // updated
    return res.status(200).send({ status: true, message: "Success", data: updatedProduct })
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, msg: "Error", error: err.message })

  }

}

//----------------------------------------------------  [TWELVETH API]  ------------------------------------------------------------\\

const getCartDetails = async (req, res) => {
  try {
    const userId = req.params.userId

    if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "userId is invalid!" }) }    // 1st V used here

    let bearerToken = req.headers.authorization;
    let token = bearerToken.split(" ")[1]
    let decodedToken = jwt.verify(token, "group73-project5")            // Authorization
    if (userId != decodedToken.userId) { return res.status(403).send({ status: false, message: "not authorized!" }) }

    const findCartOfUser = await cartModel.findOne({ userId: userId, isDeleted: false })     // DB Call
    if (!findCartOfUser) { return res.status(404).send({ status: false, message: "Cart not found or does not exist!" }) }   // DB Validation

    res.status(200).send({ status: true, message: "Cart Details", data: findCartOfUser })

  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
}

//----------------------------------------------------  [THIRTHEEN API]  ------------------------------------------------------------\\

const deleteCart = async (req, res) => {
  try {
    const userId = req.params.userId

    if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "userId is invalid!" }) }   // 1st V used here

    let bearerToken = req.headers.authorization;
    let token = bearerToken.split(" ")[1]
    let decodedToken = jwt.verify(token, "group73-project5")            // Authorization
    if (userId != decodedToken.userId) { return res.status(403).send({ status: false, message: "not authorized!" }) }

    const findCartOfUser = await cartModel.findOne({ userId: userId, isDeleted: false })   // DB Call
    if (!findCartOfUser) { return res.status(404).send({ status: false, message: "Cart not found or does not exist!" }) }

    if (findCartOfUser.totalItems === 0 && findCartOfUser.totalPrice === 0) {
      await cartModel.findOneAndUpdate(
        { _id: userId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { new: true })
      res.status(200).send({ status: true, message: "Cart has been deleted successfully!" })
    } else {
      res.status(400).send({ status: false, message: "Cart is not empty yet!" })
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
}



module.exports = { createCart, updateCart, getCartDetails, deleteCart }  // Destructuring & Exporting
