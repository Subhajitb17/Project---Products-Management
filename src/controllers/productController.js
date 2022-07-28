const productModel = require("../models/productModel");
const aws = require("../aws/s3")
const { objectValue, keyValue, numberValue, isValidObjectId, strRegex, booleanValue } = require("../middleware/validator")  // IMPORTING VALIDATORS

//------------------------------------------------------  [FIFTH API]  --------------------------------------------------------------\\

// V = Validator 

const createProduct = async (req, res) => {

  try {
    const { title, description, price, currencyId, currencyFormat, isFreeShipping, availableSizes, style, installments, isDeleted } = req.body  // Destructuring

    if (!keyValue(req.body)) return res.status(400).send({ status: false, msg: "Please provide details!" })  // 3rd V used here

    //upload book cover(a file) by aws
    let files = req.files
    let uploadFileURL;
    if (files && files.length > 0) {
      uploadFileURL = await aws.uploadFile(files[0])
    }
    else {
      return res.status(400).send({ status: false, message: "Please add product image" })
    }
    //aws-url
    let productImage = uploadFileURL

    if (!objectValue(title)) return res.status(400).send({ status: false, msg: "Please enter title!" })  // 2nd V used here
    if (!strRegex(title)) return res.status(400).send({ status: false, msg: "Please enter title in alphabets only!" })  // 2nd V used here

    let duplicateTitle = await productModel.findOne({ title })        // DB Call
    if (duplicateTitle) return res.status(400).send({ status: false, msg: "title is already in use!" })   // Duplicate Validation

    if (!objectValue(description)) return res.status(400).send({ status: false, msg: "Please enter description!" })  // 2nd V used here


    if (!price) return res.status(400).send({ status: false, msg: "Please enter price!" })
    // 2nd V used here
    if (price) {
      if (!numberValue(price)) return res.status(400).send({ status: false, msg: "Please enter price!" })
    }

    if (currencyId) {
      if (!objectValue(currencyId)) return res.status(400).send({ status: false, msg: "Please enter currencyId!" })
      // 2nd V used here
      if (currencyId !== "INR") return res.status(400).send({ status: false, msg: "Please enter currencyId in correct format!" })
    }

    if (currencyFormat) {
      if (!objectValue(currencyFormat)) return res.status(400).send({ status: false, msg: "Please enter currencyFormat!" })
      // 2nd V used here
      if (currencyFormat !== "₹") return res.status(400).send({ status: false, msg: "Please enter currencyFormat in correct format!" })
    }

    if (isFreeShipping || isFreeShipping === "") { if (!booleanValue(isFreeShipping)) return res.status(400).send({ status: false, msg: "Please enter isFreeShipping!" }) }  // 2nd V used here


    // Validation For availableSizes
    let availableSize
    if (availableSizes) {
      availableSize = availableSizes.toUpperCase().split(",")
      console.log(availableSize);  // Creating an array

      //  Enum validation on availableSizes
      for (let i = 0; i < availableSize.length; i++) {
        if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i])) {
          return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
        }
      }
    }

    if (style) {
      if (!objectValue(style)) return res.status(400).send({ status: false, msg: "Please enter style!" })
    }  // 2nd V used here

    if (installments === "") {
      if (!numberValue(installments)) return res.status(400).send({ status: false, msg: "Please enter installments!" })
    }   // 2nd V used here

    if (isDeleted === true || isDeleted === "") return res.status(400).send({ status: false, msg: "isDeleted must be false!" })  // Boolean Validation

    const products = { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, availableSizes: availableSize, style, installments, isDeleted }

    const productCreation = await productModel.create(products)

    res.status(201).send({ status: true, message: 'Success', data: productCreation })

  } catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};




//-----------------------------------------------------  [SIXTH API]  ---------------------------------------------------------------\\

const getProducts = async (req, res) => {
  try {
    const productQuery = req.query;
    const filter = { isDeleted: false };          // Object Manupulation
    const { size, name, priceGreaterThan, priceLessThan } = productQuery;       // Destructuring          

    if (objectValue(size)) {               // 2nd V used here
      const sizeArray = size.trim().split(",").map((s) => s.trim())
      filter.availableSizes = { $all: sizeArray } // The $all operator selects the documents where the value of a field is an array that contains all the specified elements.
    };

    if (name) {                // Nested If Else used here
      if (!objectValue(name)) { return res.status(400).send({ status: false, msg: "Product name is invalid!" }) }  // 2nd V used here
      if (!strRegex(name)) { return res.status(400).send({ status: false, msg: "Please enter Product name is alphabets only!" }) }  // 2nd V used here
      else { filter.title = name };
    }

    if (priceGreaterThan) filter.price = { $gt: priceGreaterThan }
    if (priceLessThan) filter.price = { $lt: priceLessThan }

    if (priceGreaterThan && priceLessThan) {
      filter.price = { $gte: priceGreaterThan, $lte: priceLessThan }
    }

    const productList = await productModel.find(filter).sort({ price: 1 })

    if (productList.length === 0) return res.status(400).send({ status: false, msg: "no product found!" })  // DB Validation

    res.status(200).send({ status: true, message: 'Product list', data: productList })

  }
  catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
};

//----------------------------------------------------  [SEVENTH API]  --------------------------------------------------------------\\

const getProductsbyId = async (req, res) => {

  const productId = req.params.productId

  if (!isValidObjectId(productId)) { return res.status(400).send({ status: false, msg: "productId is invalid!" }) }    // 1st V used here

  const findProductsbyId = await productModel.findOne({ _id: productId, isDeleted: false })     // DB Call
  if (!findProductsbyId) { return res.status(404).send({ status: false, msg: "Products not found or does not exist!" }) }   // DB Validation

  res.status(200).send({ status: true, message: 'Product Details', data: findProductsbyId })

}


//----------------------------------------------------  [EIGHTH API] ---------------------------------------------------------------\\



const updateProduct = async function (req, res) {
  try {
    const productId = req.params.productId;

    if (!isValidObjectId(productId)) return res.status(400).send({ status: false, msg: "productId is invalid!" })   // 1st V used here

    const findProductsbyId = await productModel.findOne({ _id: productId, isDeleted: false })            // DB Call
    if (!findProductsbyId) { return res.status(404).send({ status: false, msg: "Products not found or does not exist!" }) }



    const { title, description, price, currencyId, currencyFormat, isFreeShipping, availableSizes, style, installments } = req.query;  // Destructuring

    if (!keyValue(req.query)) return res.status(400).send({ status: false, msg: "Please provide something to update!" }); // 3rd V used here

    //upload book cover(a file) by aws
    let files = req.files
    let uploadFileURL;
    if (files && files.length > 0) {
      uploadFileURL = await aws.uploadFile(files[0])
    }

    //aws-url
    let productImage = uploadFileURL

    if (!(title || description || price || currencyId || currencyFormat || isFreeShipping || availableSizes || style || installments)) return res.status(400).send({ status: false, msg: "Please input valid params to update!" });

    if (title || title === "") {          // Nested If used here
      if (!objectValue(title)) return res.status(400).send({ status: false, msg: "Please enter title!" })
      if (!strRegex(title)) return res.status(400).send({ status: false, msg: "Please enter title in Alphabets only!" })
    }        // 2nd V used above

    let duplicateTitle = await productModel.findOne({ title })
    if (duplicateTitle) return res.status(400).send({ status: false, msg: "Product name is already in use!" })    // Duplicate Validation

    if (description) {       // Nested If used here
      if (!objectValue(description)) return res.status(400).send({ status: false, msg: "Please enter description!" })
    }        // 2nd V used above

    if (price) {    // Nested If used here
      if (!numberValue(price)) return res.status(400).send({ status: false, msg: "Please enter price correctly!" }) // 2nd V used here
    }

    if (currencyId) {
      if (!objectValue(currencyId)) return res.status(400).send({ status: false, msg: "Please enter currencyId!" })
      // 2nd V used here
      if (currencyId !== "INR") return res.status(400).send({ status: false, msg: "Please enter currencyId in correct format!" })
    }

    if (currencyFormat) {
      if (!objectValue(currencyFormat)) return res.status(400).send({ status: false, msg: "Please enter currencyFormat!" })
      // 2nd V used here
      if (currencyFormat !== "₹") return res.status(400).send({ status: false, msg: "Please enter currencyFormat in correct format!" })
    }

    if (isFreeShipping) {
      if (!booleanValue(isFreeShipping)) return res.status(400).send({ status: false, message: "Please enter isFreeShipping correctly!" })
    }     // 12th V used above

    let availableSize
    if (availableSizes) {
      availableSize = availableSizes.toUpperCase().split(",")
      console.log(availableSize);  // Creating an array

      //  Enum validation on availableSizes
      for (let i = 0; i < availableSize.length; i++) {
        if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i])) {
          return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]}` })
        }
      }
    }

    if (style) {
      if (!objectValue(style)) return res.status(400).send({ status: false, message: "Please provide style correctly!" })
    }     // 12th V used above

    if (installments) {
      if (!numberValue(installments)) return res.status(400).send({ status: false, message: "Please enter installments correctly!" })
    }     // 12th V used above

    const updatedProducts = await productModel.findOneAndUpdate(
      { _id: productId },
      { $set: { title, description, price, currencyId, currencyFormat, isFreeShipping, productImage, availableSize: availableSizes, style, installments } },
      { new: true }
    );
    return res.status(200).send({ status: true, message: 'Success', data: updatedProducts });

  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};

//----------------------------------------------------- [NINTH API]  --------------------------------------------------------------\\

const deleteProductsbyId = async (req, res) => {

  try {
    const productId = req.params.productId

    if (!isValidObjectId(productId)) { return res.status(400).send({ status: false, msg: "productId is invalid!" }) }   // 1st V used here

    const findProductsbyId = await productModel.findOne({ _id: productId, isDeleted: false })    // DB Call
    if (!findProductsbyId) { return res.status(404).send({ status: false, msg: "Products not found or does not exist!" }) }

    await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true })

    res.status(200).send({ status: true, message: "Product has been deleted successfully!" })
  } catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
}


module.exports = { createProduct, getProducts, getProductsbyId, updateProduct, deleteProductsbyId }  // Destructuring & Exporting

