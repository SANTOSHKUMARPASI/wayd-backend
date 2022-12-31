var express = require("express");
var router = express.Router();
const {
  isSignedIn,
  isAuthenticated,
  isAdmin,
} = require("../controllers/authentication");
const {
  checkIsCartEmpty,
  addProductToCart,
  updateCart,
  updateOrderForCart,
} = require("../controllers/cart");
const { discountverify } = require("../controllers/order");
const { getProductById } = require("../controllers/product");
const cart = require("../models/cart");

router.param("pid", getProductById);

router.get("/check", isSignedIn, isAuthenticated, checkIsCartEmpty);
router.post("/add/:pid", isSignedIn, isAuthenticated, addProductToCart);
router.post("/update/:action/:pid", isSignedIn, isAuthenticated, updateCart);
router.patch(
  "/discount/:action/:coupon",
  isSignedIn,
  isAuthenticated,
  discountverify,
  updateOrderForCart
);

router.get("/cart/:id", function (req, res) {
  cart.find(
    {
      _id: req.params.id,
    },
    function (err, docs) {
      console.log(docs);
      res.json(docs);
    }
  );
});

// const cart = require("../models/cart");
router.get("/cart/user/:userId", (req, res) => {
  cart.find(
    {
      _userID: req.params.userId,
    },
    function (err, docs) {
      console.log(docs);
      res.json(docs);
    }
  );
});

router.post("/cart/update/:pid", async (req, res) => {
  const pid = req.params.pid;
  const cartId = req.body.cartId;
  console.log(req.user);

  // await cart.findOne({ _id: cartId }, (err, docs) => {
  //   console.log(docs, "--------------------------------------------");
  // })
  await cart
    .find({
      _id: cartId,
      status: "YET_TO_CHECKOUT",
    })
    .exec(async (err, cartDetails) => {
      console.log(cartDetails, "cart details ------------------------");
      var newQuantityArray = cartDetails[0].quantityArray;
      var newCost = cartDetails[0].cost;
      var newdeatils = cartDetails[0].details;
      cartDetails[0]._productIDArray.forEach(async (product, i) => {
        if (pid == product._id) {
          // new cost
          const detailFilter = newdeatils.filter((det) => det._id == pid);
          detailFilter[0].Selectedquantity = req.body.quantity;
          newQuantityArray.splice(i, 1, req.body.quantity);

          let initialVal = 0;
          let result = newdeatils.reduce(
            (acc, elem) => acc + elem.price * elem.Selectedquantity,
            initialVal
          );
          newCost = result;
          console.log(newCost, "newCost ---------------------------");

          // newCost =
          //   // parseInt(newCost) +
          //   (parseInt(price ) * parseInt(req.body.quantity) )
        }
      });
      console.log(newdeatils, "newdeatils", newQuantityArray, newCost);

      cartDetails[0].quantityArray = newQuantityArray;
      cartDetails[0].details = newdeatils;

      cartDetails[0].cost = newCost;

      cartDetails[0].save(async (err, updatedCartDetails) => {
        if (err) {
          res.json({
            type: "UPDATE_REMOVE_ERROR",
            status: "FAILED",
            err,
          });
        } else {
          res.json({
            type: "SUCCESSFULLY_UPDATED_CART_DETAILS",
            status: "SUCCESS",
            cartDetails: updatedCartDetails,
          });
        }
      });
    });
});

module.exports = router;
