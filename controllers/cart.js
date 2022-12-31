const mongoose = require("mongoose");
const product = require("../models/product");
const cart = require("../models/cart");
const Coupon = require("../models/discount");
const { Order } = require("../models/oder");
const oder = require("../models/oder");

module.exports = {
  checkIsCartEmpty: async (req, res) => {
    if (!req.user) {
      return;
    } else {
      const cartDetails = await cart
        .find({
          _userID: req.user._id,
          status: "YET_TO_CHECKOUT",
        })
        .exec();
      if (cartDetails.length > 0) {
        res.json(cartDetails);
      } else {
        res.status(404).json({
          error: "Cart is empty",
        });
      }
    }
  },
  addProductToCart: async (req, res) => {
    console.log(req.user);
    console.log(req.product);
    const { details } = req.body;
    let prod = details[0];
    var _productID = req.params.pid;
    const cartID = await cart.find({ _userID: req.user._id });
    console.log(cartID, "cardId");
    _productID = mongoose.Types.ObjectId(_productID);
    console.log(_productID);

    const ifCartExist = await cart
      .find({
        _userID: req.user._id,
        status: "YET_TO_CHECKOUT",
      })
      .exec();
    var output = {};

    if (ifCartExist == null || ifCartExist.length == 0 || ifCartExist == "[]") {
      //
      // create here

      // calculate the cart cost
      // const productDetails = await product.findById({_id : _productID}).exec();
      // console.log(detailsList, "detials ");
      console.log(details, "details from body");
      console.log(details[0], "detials");

      console.log(typeof quantity);
      const cost = prod.price * prod.quantity;
      console.log(cost, "cost");

      // product and quantity array
      var productArray = [];
      var quantityArray = [];
      let detailsList = [];
      productArray.push(_productID);
      console.log(_productID, "_productID");
      quantityArray.push(prod.quantity);
      detailsList.push({
        _id: _productID,
        name: prod.name,
        grade: prod.grade,
        price: prod.price,
        Selectedquantity: prod.quantity,
      });
      console.log(productArray);
      console.log(quantityArray);
      console.log(detailsList, "details list");
      // add to db

      return new cart({
        _userID: req.user._id,
        _productIDArray: productArray,
        quantityArray,
        cost,
        details: detailsList,
        status: "YET_TO_CHECKOUT",
        numberOfItem: productArray.length,
        // userType: req.body.userType,
      }).save((err, newCartDetails) => {
        if (err) {
          console.log(err);
          output = {
            type: "NEW_CART_ERROR",
            status: "FAILED",
            err,
          };

          res.json(output);
        } else {
          output = {
            type: "NEW_CART_CREATED",
            status: "SUCCESS",
            cartDetails: newCartDetails,
          };

          res.json(output);
        }
      });
    } else {
      // update here

      // get the existing cart details

      return cart.find(
        {
          _userID: req.user._id,
          status: "YET_TO_CHECKOUT",
        },
        async (err, userFromCart) => {
          var countForIfProductAlreadyExist = 0;

          userFromCart[0]._productIDArray.forEach((pid) => {
            if (`${pid}` == `${_productID}`) {
              countForIfProductAlreadyExist++;
            }
          });
          if (countForIfProductAlreadyExist > 0) {
            output = {
              type: "PRODUCT_ALREADY_EXIST",
              status: "FAILED",
            };
            res.json(output);
          } else {
            var productArray = userFromCart[0]._productIDArray;
            var quantityArray = userFromCart[0].quantityArray;
            var details = userFromCart[0].details;
            // updating the product and quantity array ....length or both should be equal
            productArray.push(_productID);
            quantityArray.push(prod.quantity);
            details.push({
              _id: _productID,
              name: req.product.name,
              grade: req.product.grade,
              price: req.product.price,
              Selectedquantity: prod.quantity,
            });

            // get the new cost
            // const productDetails = await product.findById(_productID).exec();
            const newCost = prod.price * prod.quantity;

            // updating the existing cart data for this user
            userFromCart[0]._productIDArray = productArray;
            userFromCart[0].quantityArray = quantityArray;
            userFromCart[0].details = details;
            userFromCart[0].numberOfItem = userFromCart[0].numberOfItem + 1;
            userFromCart[0].cost = userFromCart[0].cost + newCost;
            userFromCart[0].save((err, updatedUserFromCart) => {
              if (err) {
                output = {
                  type: "CART_UPDATED_ERROR",
                  status: "FAILED",
                  err,
                };

                res.json(output);
              } else {
                output = {
                  type: "CART_UPDATED",
                  status: "SUCCESS",
                  cartDetails: userFromCart,
                };
                res.json(output);
              }
            });
          }
        }
      );

      // calculate the cost
      // update the db
    }
  },
  //update cart

  updateCart: async (req, res) => {
    const pid = req.params.pid;

    switch (req.params.action) {
      case "remove":
        await cart
          .find({
            _id: req.body.cartId,
            status: "YET_TO_CHECKOUT",
          })
          .exec(async (err, cartDetails) => {
            console.log(cartDetails, "cartDetails");
            var newProductArrayID = cartDetails[0]._productIDArray;
            var newQuantityArray = cartDetails[0].quantityArray;
            var newdetails = cartDetails[0].details;
            var newCost = cartDetails[0].cost;
            var newNumberOfItem = cartDetails[0].numberOfItem;
            console.log(newdetails, "new Details --------------------");
            cartDetails[0]._productIDArray.forEach(async (product, i) => {
              if (pid == product._id) {
                // new cost
                const quantityOfThisProduct = cartDetails[0].quantityArray[i];
                newCost = newCost - req.product.price * quantityOfThisProduct;
                // new numberOfItem
                newNumberOfItem--;
                newProductArrayID.splice(i, 1);
                newQuantityArray.splice(i, 1);
                newdetails.splice(i, 1);
              }
            });
            cartDetails[0]._productIDArray = newProductArrayID;
            cartDetails[0].quantityArray = newQuantityArray;
            cartDetails[0].details = newdetails;
            cartDetails[0].numberOfItem = newNumberOfItem;
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
        break;
      case "decrease":
        await cart
          .find({
            _userID: req.user._id,
            status: "YET_TO_CHECKOUT",
          })
          .exec(async (err, cartDetails) => {
            // if(cartDetails[0]._id == _cartID){
            //     if(err){
            //         res.json({
            //             type:"FETCH_REMOVE_ERROR",
            //             status : "FAILED",
            //             err
            //         })
            //     }else{
            console.log(newProductArray, "newPRoductArray");
            console.log(cartDetails, "cartDetails");
            var newQuantityArray = cartDetails[0].quantityArray;
            var newProductArray = cartDetails[0]._productIDArray;
            var newdeatils = cartDetails[0].details;
            var newCost = cartDetails[0].cost;
            var itemsNumber = cartDetails[0].numberOfItem;

            cartDetails[0]._productIDArray.forEach(async (product, i) => {
              console.log(pid, product);
              if (pid == product) {
                // new cost
                if (newQuantityArray[i] - 1 === 0) {
                  newProductArray.splice(i, 1);
                  newQuantityArray.splice(i, 1);
                  newdeatils.splice(i, 1);
                  newCost = newCost - req.product.price;
                  itemsNumber = itemsNumber - 1;
                } else {
                  const detailFilter = newdeatils.filter(
                    (det) => det._id == pid
                  );
                  detailFilter[0].Selectedquantity =
                    newQuantityArray[i] - req.body.quantity;
                  newQuantityArray.splice(
                    i,
                    1,
                    newQuantityArray[i] - req.body.quantity
                  );
                  newdeatils.splice(i, 1, detailFilter[0]);
                  newCost = newCost - req.product.price * req.body.quantity;
                }
              }
            });
            cartDetails[0].quantityArray = newQuantityArray;
            cartDetails[0].details = newdeatils;
            cartDetails[0].numberOfItem = itemsNumber;

            cartDetails[0].cost = newCost;
            console.log(cartDetails[0]);
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
        break;
      case "increase":
        await cart
          .find({
            _userID: req.user._id,
            status: "YET_TO_CHECKOUT",
          })
          .exec(async (err, cartDetails) => {
            var newQuantityArray = cartDetails[0].quantityArray;
            var newCost = cartDetails[0].cost;
            var newdeatils = cartDetails[0].details;
            cartDetails[0]._productIDArray.forEach(async (product, i) => {
              if (pid == product._id) {
                // new cost
                const detailFilter = newdeatils.filter((det) => det._id == pid);
                detailFilter[0].Selectedquantity =
                  newQuantityArray[i] + req.body.quantity;
                newQuantityArray.splice(
                  i,
                  1,
                  newQuantityArray[i] + req.body.quantity
                );
                newCost =
                  parseInt(newCost) +
                  parseInt(req.product.price * req.body.quantity);
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
        break;
      default:
        break;
    }
  },
  updateOrderForCart: async (req, res) => {
    const discount = req.discount;

    const cartDetails = req.cartDetails;
    switch (req.params.action) {
      case "apply":
        if (!cartDetails[0].attached_coupon) {
          cartDetails[0].cost = cartDetails[0].cost - discount.discount;
          cartDetails[0].attached_coupon = discount._id;
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
        } else {
          res.status(404).json({
            error: "Coupon already exist in cart",
          });
        }
        break;
      case "delete":
        if (cartDetails[0].attached_coupon) {
          cartDetails[0].attached_coupon = null;
          cartDetails[0].cost = cartDetails[0].cost + discount.discount;
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
        } else {
          res.status(404).json({
            error: "No coupon found in cart",
          });
        }
        break;
    }
  },
};
