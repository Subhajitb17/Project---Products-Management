const booksModel = require("../models/productModel");
const reviewModel = require("../models/cartModel")
const jwt = require("jsonwebtoken");
const { objectValue, keyValue, isValidISBN, isValidArray, numberValue, isValidDate, isValidObjectId, strRegex, urlRegex } = require("../middleware/validator")  // IMPORTING VALIDATORS

//------------------------------------------------------  THIRD API  ------------------------------------------------------------------\\

// V = Validator 

const createBooks = async (req, res) => {

  try {
    const { title, excerpt, userId, ISBN, category, subcategory, releasedAt, bookCover, isDeleted, reviews } = req.body  // Destructuring

    if (!keyValue(req.body)) return res.status(400).send({ status: false, msg: "Please provide details!" })  // 3rd V used here

    if (!objectValue(title)) return res.status(400).send({ status: false, msg: "Please enter title!" })  // 2nd V used here

    let duplicateTitle = await booksModel.findOne({ title })        // DB Call
    if (duplicateTitle) return res.status(400).send({ status: false, msg: "title is already in use!" })   // Duplicate Validation

    if (!objectValue(excerpt)) return res.status(400).send({ status: false, msg: "Please enter excerpt!" })  // 2nd V used here

    if (!objectValue(userId)) return res.status(400).send({ status: false, msg: "Please enter userId!" })   // 2nd V used here
    if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "userId is invalid!" })  // 1st V used here

    if (!objectValue(ISBN)) return res.status(400).send({ status: false, msg: "Please enter ISBN number!" })  // 2nd V used here
    if (!isValidISBN(ISBN)) { return res.status(400).send({ status: false, message: 'Please provide a valid ISBN of 13 digits!' }) }
    // 12th V used above 

    let duplicateISBN = await booksModel.findOne({ ISBN })           // DB Call
    if (duplicateISBN) return res.status(400).send({ status: false, msg: "ISBN is already registered!" })   // Duplicate Validation

    if (!objectValue(category)) return res.status(400).send({ status: false, msg: "Please enter category!" })  // 2nd V used here
    if (!strRegex(category)) return res.status(400).send({ status: false, msg: "Please enter category in Alphabets only!" })  // 14th V used here

    if (!isValidArray(subcategory)) return res.status(400).send({ status: false, msg: "Please enter subcategory!" }) // 13th V used here 

    if (!urlRegex(bookCover)) return res.status(400).send({ status: false, msg: "Please enter valid link!" }) // 17th V used here 

    if (isDeleted === true) return res.status(400).send({ status: false, msg: "isDeleted must be false!" })  // Boolean Validation

    if (!isValidDate(releasedAt)) return res.status(400).send({ status: false, msg: "Please enter releasedAt in the right format(YYYY-MM-DD)!" })      // 16th V used above 

    if (reviews || reviews === "") {            // Nested If used here
      if (!numberValue(reviews)) return res.status(400).send({ status: false, msg: "Please enter review!" })    // 15th V used here
    }

    let token = req.headers["x-api-key"]
    let decodedToken = jwt.verify(token, "group66-project3")          // Authorization
    if (userId != decodedToken.userId) { return res.status(403).send({ status: false, msg: "not authorized!" }) }

    const bookCreation = await booksModel.create(req.body)

    res.status(201).send({ status: true, message: 'Success', data: bookCreation })

  }

  catch (error) {
    res.status(500).send({ status: false, msg: error.message })
  }

}

//------------------------------------------------------  FOURTH API  ------------------------------------------------------------------\\

const getBooks = async (req, res) => {
  try {
    const userQuery = req.query;
    const filter = { isDeleted: false };          // Object Manupulation
    const { userId, category, subcategory } = userQuery;       // Destructuring          

    if (!keyValue(userQuery)) return res.status(400).send({ status: false, msg: "Please provide atleast one param!" }); // 3rd V used here

    if (userId) {                // Nested If Else used here
      if (!objectValue(userId)) { return res.status(400).send({ status: false, msg: "userId is invalid!" }) }  // 2nd V used here
      if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, msg: "userId is invalid!" }) } // 1st V used here
      else { filter.userId = userId };
    }
    if (objectValue(category)) { filter.category = category.trim() };        // 2nd V used here
    if (objectValue(subcategory)) {               // 2nd V used here
      const subcategoryArray = subcategory.trim().split(",").map((s) => s.trim())
      filter.subcategory = { $all: subcategoryArray } // The $all operator selects the documents where the value of a field is an array that contains all the specified elements.
    };

    const bookList = await booksModel.find(filter).select({ title: 1, excerpt: 1, userId: 1, category: 1, review: 1, releasedAt: 1 });

    if (bookList.length === 0) return res.status(400).send({ status: false, msg: "no book found!" })  // DB Validation

    const sortedBooks = bookList.sort((a, b) => a.title.localeCompare(b.title))  // Sorting in Alphabetical Order
    // The localeCompare() method returns a number indicating whether a reference string comes before, or after, or is the same as the given string in sort order.

    res.status(200).send({ status: true, message: 'Books list', data: sortedBooks })

  }
  catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

//------------------------------------------------------  FIFTH API  ------------------------------------------------------------------\\

const getBooksbyId = async (req, res) => {

  const bookId = req.params.bookId

  if (!isValidObjectId(bookId)) { return res.status(400).send({ status: false, msg: "bookId is invalid!" }) }    // 1st V used here

  const findBooksbyId = await booksModel.findOne({ _id: bookId, isDeleted: false })     // DB Call
  if (!findBooksbyId) { return res.status(404).send({ status: false, msg: "Books not found or does not exist!" }) }   // DB Validation

  const reviews = await reviewModel.find({ bookId: bookId })        // DB Call

  res.status(200).send({ status: true, message: 'Books list', data: findBooksbyId, reviewsData: reviews })

}


//------------------------------------------------------  SIXTH API  ------------------------------------------------------------------\\



const updateBooks = async function (req, res) {
  try {
    const bookId = req.params.bookId;

    if (!isValidObjectId(bookId)) return res.status(400).send({ status: false, msg: "bookId is invalid!" })   // 1st V used here

    const findBooksbyId = await booksModel.findOne({ _id: bookId, isDeleted: false })            // DB Call
    if (!findBooksbyId) { return res.status(404).send({ status: false, msg: "Books not found or does not exist!" }) }

    let token = req.headers["x-api-key"]
    let decodedToken = jwt.verify(token, "group66-project3")            // Authorization
    if (findBooksbyId.userId != decodedToken.userId) { return res.status(403).send({ status: false, msg: "not authorized!" }) }

    const { title, excerpt, releasedAt, ISBN } = req.body;  // Destructuring

    if (!keyValue(req.body)) return res.status(400).send({ status: false, msg: "Please provide something to update!" }); // 3rd V used here

    if (!(title || excerpt || releasedAt || ISBN)) return res.status(400).send({ status: false, msg: "Please input valid params to update!" });

    if (title || title === "") {          // Nested If used here
      if (!objectValue(title)) return res.status(400).send({ status: false, msg: "Please enter title!" })
    }        // 2nd V used above

    let duplicateTitle = await booksModel.findOne({ title })
    if (duplicateTitle) return res.status(400).send({ status: false, msg: "title is already in use!" })    // Duplicate Validation

    if (excerpt || excerpt === "") {       // Nested If used here
      if (!objectValue(excerpt)) return res.status(400).send({ status: false, msg: "Please enter excerpt!" })
    }        // 2nd V used above

    if (releasedAt || releasedAt === "") {    // Nested If used here
      if (!objectValue(releasedAt)) return res.status(400).send({ status: false, msg: "Please enter releasedAt!" }) // 2nd V used here
      if (!isValidDate(releasedAt)) return res.status(400).send({ status: false, msg: "Please enter releasedAt in the right format(YYYY-MM-DD)!" })      // 16th V used above 
    }

    if (ISBN || ISBN === "") {
      if (!isValidISBN(ISBN)) return res.status(400).send({ status: false, message: 'Please provide a valid ISBN of 13 digits!' })
    }     // 12th V used above

    let duplicateISBN = await booksModel.findOne({ ISBN })    // DB Call
    if (duplicateISBN) return res.status(400).send({ status: false, msg: "ISBN is already registered!" })  // Duplicate Validation

    const updatedBooks = await booksModel.findOneAndUpdate(
      { _id: bookId },
      { $set: { title, excerpt, releasedAt, ISBN } },
      { new: true }
    );
    return res.status(200).send({ status: true, message: 'Success', data: updatedBooks });

  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};

//------------------------------------------------------  SEVENTH API  ------------------------------------------------------------------\\

const deleteBooksbyId = async (req, res) => {

  try {
    const bookId = req.params.bookId

    if (!isValidObjectId(bookId)) { return res.status(400).send({ status: false, msg: "bookId is invalid!" }) }   // 1st V used here

    const findBooksbyId = await booksModel.findOne({ _id: bookId, isDeleted: false })    // DB Call
    if (!findBooksbyId) { return res.status(404).send({ status: false, msg: "Books not found or does not exist!" }) }

    let token = req.headers["x-api-key"]
    let decodedToken = jwt.verify(token, "group66-project3")          // Authorization
    if (findBooksbyId.userId != decodedToken.userId) { return res.status(403).send({ status: false, msg: "not authorized!" }) }

    await booksModel.findOneAndUpdate(
      { _id: bookId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true })

    res.status(200).send({ status: true, message: "Book deleted successfully!" })
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
}


module.exports = { createBooks, getBooks, getBooksbyId, updateBooks, deleteBooksbyId }  // Destructuring & Exporting

