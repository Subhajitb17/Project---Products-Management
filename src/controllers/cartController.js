const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const { objectValue, keyValue, numberValue, isValidObjectId, strRegex, numberValue2 } = require("../middleware/validator");  // IMPORTING VALIDATORS


//-----------------------------------------------------  TENTH API  ----------------------------------------------------------------\\

// V = Validator 

const createCart = async (req, res) => {

  try {

    const userId = req.params.userId
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "userId is invalid!" })  // 1st V used here
    let duplicateUserId = await userModel.findById(userId)
    if (!duplicateUserId) return res.status(400).send({ status: false, message: "userId is not present in DB!" })

    let {cartId, productId, quantity, totalPrice, totalItems } = req.body   // Destructuring

    if (!keyValue(req.body)) return res.status(400).send({ status: false, msg: "Please provide details!" })   // 3rd V used here

    if(cartId) {
      if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, msg: "cartId is invalid!" })  // 1st V used here
      findCartById = await cartModel.findOne({_id: cartId, userId: userId})
      if (!findCartById) { return res.status(404).send({ status: false, msg: "Cart not found!" }) } // DB Validation
    }
     
    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, msg: "productId is invalid!" })  // 1st V used here
    const findProductById = await productModel.findOne({_id: productId, isDeleted: false })      // DB Call
    if (!findProductById) { return res.status(404).send({ status: false, msg: "Product not found or does not exist!" }) } // DB Validation


    if (!numberValue2(quantity)) return res.status(400).send({ status: false, msg: "Please enter valid quantity!" })          // 2nd V used here
    if (quantity < 1) return res.status(400).send({ status: false, msg: "Quantity cannot be less than 1!" }) 
    
    if (!numberValue2(totalPrice)) return res.status(400).send({ status: false, msg: "Please enter totalPrice in correct format!" }) //15th V used here

    if (!numberValue2(totalItems)) return res.status(400).send({ status: false, msg: "Please enter totalItems in correct format!" }) //15th V used here

    const cartItems = { userId:userId, items: [{productId:productId, quantity:quantity}], totalPrice:totalPrice, totalItems:totalItems }   // Destructuring

    const cartCreation = await cartModel.create(cartItems)

    // if (reviewCreation) {
    //   findBooksbyId.reviews = findBooksbyId.reviews + 1;     // Increasing the review count by 1

      // await booksModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $set: { reviews: findBooksbyId.reviews } })
 
    // }

    res.status(201).send({ status: true, message: 'Success', data: cartCreation })

  }
  catch (error) {
    res.status(500).send({ status: false, msg: error.message })
  }

}

//-------------------------------------------------------  NINTH API  ---------------------------------------------------------------------\\

const updateReviews = async function (req, res) {
  try {
    const {bookId, reviewId} = req.params;                         // Destructuring
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

     await booksModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $set: { reviews: findBooksbyId.reviews } }) ;

     await reviewModel.findOneAndUpdate(
      { _id: reviewId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } })
      

    return res.status(200).send({ status: true, message: "Review deleted successfully!", data: findBooksbyId });

  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
}

module.exports = { createCart }  // Destructuring