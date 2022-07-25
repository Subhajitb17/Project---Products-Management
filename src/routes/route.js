const express = require("express")
const route = express.Router();
const userController = require("../controllers/userController");
const booksController = require("../controllers/booksController");
const reviewController = require("../controllers/reviewController");
const middleware = require("../middleware/auth")
const aws = require("../aws/s3")


route.post("/register" , userController.createUser)

route.post("/login" , userController.loginUser)

// route.post("/write-file-aws", aws.uploadBookcover)

route.post("/books" ,middleware.authentication, booksController.createBooks)

route.get("/books" ,middleware.authentication, booksController.getBooks)

route.get("/books/:bookId" ,middleware.authentication,booksController.getBooksbyId)

route.put("/books/:bookId" ,middleware.authentication, booksController.updateBooks)

route.delete("/books/:bookId" ,middleware.authentication, booksController.deleteBooksbyId)

route.post("/books/:bookId/review" , reviewController.createReviews)

route.put("/books/:bookId/review/:reviewId" , reviewController.updateReviews)

route.delete("/books/:bookId/review/:reviewId" , reviewController.deleteReviewbyId)

module.exports = route
