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
  let passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,50}$/
  ;
  if (passwordRegex.test(value))
    return true;
}

// 8th Validator ==>

const pincodeRegex = (value) => {
  let pincodeRegex = /^[1-9][0-9]{5}$/;
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

// // 15th Validator ==>

// const currencyRegex = (value) => {
//   let currencyRegex = /[\u00a4\u060b\u0e3f\u002f\u002e\u20bf\u20b5\u00a2\u20a1\u0024\u0434\u0435\u043d\u0438\u043d\u0024\u20ab\u20ac\u0192\u002c\u20b2\u20b4\u20ad\u010d\u043b\u0432\u20ba\u20a5\u20a6\u0024\u20b1\u00a3\u17db\u20bd\u20b9\u20a8\u20aa\u09f3\u20ae\u20a9\u00a5\u0142\u20b3\u20a2\u20b0\u20bb\u20af\u20a0\u20a4\u2133\u20a7\u211b\u20b7\u20b6\u09f2\u09f9\u09fb\u07fe\u07ff\u0bf9\u0af1\u0cb0\u0dbb\u0dd4\ua838\u1e2f\u0046\u0061-\u007a\u0041-\u005a\u0030-\u0039\u2000-\u200f\u2028-\u202f\u0621-\u0628\u062a-\u063a\u0641-\u0642\u0644-\u0648\u064e-\u0651\u0655\u067e\u0686\u0698\u06a9\u06af\u06be\u06cc\u06f0-\u06f9\u0629\u0643\u0649-\u064b\u064d\u06d5\u0660-\u0669\u005c]{1,5}/;
//   if (currencyRegex.test(value))
//     return true;
// }


module.exports = { isValidObjectId, objectValue, nameRegex, emailRegex, keyValue, mobileRegex, passwordRegex, pincodeRegex, isValidArray, booleanValue, numberValue, isValidDate, strRegex, urlRegex };     // EXPORTING THEM
                                                                                                        