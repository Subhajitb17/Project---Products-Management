const mongoose = require("mongoose");

//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<====================  VALIDATORS  ====================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\\

// 1st Validator ==>

const isValidObjectId = (objectId) => {
  return mongoose.Types.ObjectId.isValid(objectId);
};

// 2nd Validator ==>

const objectValue = (value) => {
  if (typeof value === "undefined" || value === null || typeof value === "boolean" || typeof value === "number") return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  if (typeof value === "object" && Object.keys(value).length === 0) return false;

  return true;
};

// 3rd Validator ==>

const keyValue = (value) => {
  if (Object.keys(value).length === 0) return false;
  return true;
};

// 4th Validator ==>

const nameRegex = (value) => {
  let nameRegex =  /^(?![\. ])[a-zA-Z\. ]+(?<! )$/;
  if (nameRegex.test(value)) return true;
};

// 5th Validator ==>

const emailRegex = (value) => {
  let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-z\-0-9]+\.)+[a-z]{2,}))$/;
  if (emailRegex.test(value)) return true;
};

// 6th Validator ==>

const mobileRegex = (value) => {
  let mobileRegex = /^[6-9]\d{9}$/;
  if (mobileRegex.test(value))
    return true;
}

// 7th Validator ==>

const passwordRegex = (value) => {
  let passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,15}$/
  ;
  if (passwordRegex.test(value))
    return true;
}

// 8th Validator ==>

const pincodeRegex = (value) => {
  let pincodeRegex = /^[1-9]{1}[0-9]{5}$/;
  if (pincodeRegex.test(value))
    return true;
}


// 9th Validator ==>

const strRegex = (value) => {
  let strRegex = /^[A-Za-z\s]{0,}[\.,'-]{0,1}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}[\.,'-]{0,}[A-Za-z\s]{0,}$/;
  if (strRegex.test(value))
    return true;
}

// 10th Validator ==>

const isValidArray = (value) => {
  if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
          if (value[i].trim().length === 0 || typeof (value[i]) !== "string" || value.trim().length === 0) { return false }
      }
      return true
  } else { return false }
}

// 11th Validator ==>

const booleanValue = (value) => {
  if (typeof value === "undefined" || value === null || typeof value === "number" || typeof value === true) return false;
  if (typeof value === false && value.toString().trim().length === 0) return false;
  return true;
};

// 12th Validator ==>

const numberValue = (value) => {
  if (typeof value === "undefined" || value === null || typeof value === "boolean") return false;
  if (typeof value === "number" && value.toString().trim().length === 0) return false
  return true;
};

// 13th Validator ==>

const isValidDate =function(date){
  const isValidDate = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/
  return isValidDate.test(date)
}

// 14th Validator ==>

const urlRegex = (value) => {
  let urlRegex = /(https|http?:\/\/.*\.(?:png|gif|webp|jpeg|jpg))/i;
  if (urlRegex.test(value))
    return true;
}

// 15th Validator ==>

const numberValue2 = (value) => {
  if (typeof value === "undefined" || value === null || typeof value === "boolean" || typeof value === "string") return false;
  if (typeof value === "number" && value.toString().trim().length === 0) return false
  return true;
};


//Validation for Quantity
const validQuantity = function isInteger(value) {
  if(value < 1) return false
   if(value % 1 == 0 ) return true
}


module.exports = { isValidObjectId, objectValue, nameRegex, emailRegex, keyValue, mobileRegex, passwordRegex, pincodeRegex, isValidArray, booleanValue, numberValue, isValidDate, strRegex, urlRegex, numberValue2, validQuantity };     // EXPORTING THEM
                                                                                                        