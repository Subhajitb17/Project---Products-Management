const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const { objectValue, keyValue, numberValue, isValidObjectId, strRegex, numberValue2, validQuantity } = require("../middleware/validator");  // IMPORTING VALIDATORS


//-----------------------------------------------------  [TENTH API]  --------------------------------------------------------------\\

// V = Validator 

//---------------Create Cart--------------//

const createCart = async function (req, res) {

  try {
    const userId = req.params.userId;
    const requestBody = req.body;
    let { quantity, productId, cartId } = requestBody;

    //-----------Request Body Validation---------//

    if (!keyValue(requestBody)) {
      return res.status(400).send({ status: false, message: "Please provide valid request body" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "Please provide valid User Id" });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).send({ status: false, message: "Please provide valid Product Id" });
    }

    if (!quantity) {
      quantity = 1;

    } else {
      if (!validQuantity(quantity)) {
        return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." });
      }
    }
    //---------Find User by Id--------------//

    const findUser = await userModel.findById({ _id: userId });

    if (!findUser) {
      return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
    }

    const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });

    if (!findProduct) {
      return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` });
    }
    //----------Find Cart By Id----------//
    if (cartId) {
      if (!isValidObjectId(cartId)) {
        return res.status(400).send({ status: false, message: "Please provide valid cartId" });
      }

      let cartIsUnique = await cartModel.findOne({ _id: cartId, isDeleted: false })

      if (!cartIsUnique) {
        return res.status(400).send({ status: false, message: "cartId doesn't exists" })
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

      let price = quantity * findProduct.price + findCartOfUser.totalPrice;

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

const updateReviews = async function (req, res) {
  try {
    const { bookId, reviewId } = req.params;                         // Destructuring
    const { review, rating, reviewedBy } = req.body;                  // Destructuring

    if (!keyValue(req.body)) return res.status(400).send({ status: false, msg: "Please provide details!" })  // 3rd V used here

    if (!isValidObjectId(bookId)) return res.status(400).send({ status: false, msg: "bookId is invalid!" })  // 1st V used here

    if (!isValidObjectId(reviewId)) return res.status(400).send({ status: false, msg: "reviewId is invalid!" })  // 1st V used here

    if (review || review === "") {
      if (!objectValue(review)) return res.status(400).send({ status: false, msg: "Please enter review!" })   // 2nd V used here
    }

    if (rating || rating === "") {
      if (!numberValue(rating)) return res.status(400).send({ status: false, msg: "Please enter rating in correct format!" }) // 15th V used here
      if (!ratingRegex(rating)) return res.status(400).send({ status: false, msg: "rating is invalid!" })  // 10th V used here
    }

    if (reviewedBy || reviewedBy === "") {
      if (!objectValue(reviewedBy)) return res.status(400).send({ status: false, msg: "Please enter reviewer's name!" })    // 2nd V used here
      if (!strRegex(reviewedBy)) return res.status(400).send({ status: false, msg: "Please enter reviewer's name correctly!" }) // 11th V used here

    }

    const findBooksbyId = await booksModel.findOne({ _id: bookId, isDeleted: false })   // DB Call
    if (!findBooksbyId) { return res.status(404).send({ status: false, msg: "Books not found or does not exist!" }) } // DB Validation

    const findReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })  // DB Call
    if (!findReview) { return res.status(404).send({ status: false, msg: "Review not found or does not exist!" }) } // DB Validation

    const updatedreview = await reviewModel.findOneAndUpdate(
      { _id: reviewId },
      { $set: { review, rating, reviewedBy }, },
      { new: true }
    );
    return res.status(200).send({ status: true, message: 'Success', data: findBooksbyId, updatedreview });

  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};
//-------------------------------------------------------  TENTH API  ---------------------------------------------------------------------\\

const deleteReviewbyId = async (req, res) => {
  try {
    const bookId = req.params.bookId
    const reviewId = req.params.reviewId;

    if (!isValidObjectId(bookId)) return res.status(400).send({ status: false, msg: "bookId is invalid!" })   // 1st V used here
    if (!isValidObjectId(reviewId)) return res.status(400).send({ status: false, msg: "reviewId is invalid!" })  // 1st V used here

    const findBooksbyId = await booksModel.findOne({ _id: bookId, isDeleted: false })   // DB Call
    if (!findBooksbyId) { return res.status(404).send({ status: false, msg: "Books not found or does not exist!" }) } // DB Validation

    const findReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })    // DB Call
    if (!findReview) { return res.status(404).send({ status: false, msg: "review not found or does not exist!" }) } // DB Validation

    findBooksbyId.reviews = findBooksbyId.reviews - 1;        // Decreasing the review count by 1

    await booksModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $set: { reviews: findBooksbyId.reviews } });

    await reviewModel.findOneAndUpdate(
      { _id: reviewId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } })


    return res.status(200).send({ status: true, message: "Review deleted successfully!", data: findBooksbyId });

  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
}

module.exports = { createCart }  // Destructuring