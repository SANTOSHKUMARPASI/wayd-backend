const express = require("express");
var router = express.Router();
const Order = require("../models/oder");

const {
  getUserById,
  getUser,
  updateUser,
  userPurchaseList,
  updateCashCollection,
  updateDueAmount,
  cashcollectionByUser,
  updateuserDetails,
} = require("../controllers/user");

const {
  isSignedIn,
  isAuthenticated,
  isAdmin,
} = require("../controllers/authentication");

router.param("userId", getUserById);
router.get("/user/:userId", getUserById);
router.put("/user/:userId", isSignedIn, isAuthenticated, updateUser);
router.get("/orders/user/:userId", isAdmin, userPurchaseList);
router.post("/cashcollection", updateCashCollection);
router.put("/update/amount/:id", updateDueAmount);
router.get("/user/due/:userId", cashcollectionByUser);
router.put("/update/user/:userid", updateuserDetails);

module.exports = router;
