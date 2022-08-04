const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const jwt = require('jsonwebtoken')
const { keyValue, isValidObjectId, validQuantity } = require("../middleware/validator");  // IMPORTING VALIDATORS


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
        if (arr[i].productId.toString()===productId) {
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

    let { cartId, productId, removeProduct } = req.body;

    if (!keyValue(req.body)) return res.status(400).send({ status: false, message: "Please provide valid params to update!" });

    if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please enter valid cartId!" });

    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId!" });

    if (removeProduct !== 1 || 0) return res.status(400).send({ status: false, message: "Please enter valid removeProduct value as 1 or 0!" });

    let findCartById = await cartModel.findById(cartId);

    if (!findCartById) return res.status(404).send({ status: false, message: "CartId doesnt exists!" });

    let findProductById = await productModel.findOne({ _id: productId, isDeleted: false, });

    if (!findProductById) return res.status(400).send({ status: false, message: "Product has been deleted or does not exist!" });

    let update = {};
    let product = findCartById.items;
    let quantity = 0;

    for (let i = 0; i < product.length; i++) {
      if (product[i].productId.toString() == productId) {
        quantity = product[i].quantity;
        break;
      }
    }

    if (removeProduct == 0 || quantity == 1) {
      update["$pull"] = { items: { productId: productId } }; //Used pull to remove an element from an array

      for (let i = 0; i < product.length; i++) {
        if (product[i].productId.toString() == productId) {
          update.totalPrice = findCartById.totalPrice - findProductById.price * product[i].quantity;
          update.totalItems = findCartById.totalItems - 1;
          break;
        }
      }
    } else if (removeProduct == 1) {
      for (let i = 0; i < product.length; i++) {
        if (product[i].productId.toString() == productId) {
          update[`items.${i}.quantity`] = findCartById.items[i].quantity - 1;
          update.totalPrice = findCartById.totalPrice - findProductById.price;
          break;
        }
      }
    }
    let updatedCart = await cartModel.findOneAndUpdate({ _id: cartId }, update, { new: true });
    return res.status(200).send({ status: true, message: "Success", data: updatedCart });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

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

  if(findCartOfUser.totalItems === 0 && findCartOfUser.totalPrice === 0 ) {
     await cartModel.findOneAndUpdate(
      { _id: cartId, isDeleted: false },
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