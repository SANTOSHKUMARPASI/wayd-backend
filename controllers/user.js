const User = require("../models/user");
const { Order } = require("../models/oder");
const Pin = require("../models/pin_sp");

const Product = require("../models/product");
const { CostExplorer } = require("aws-sdk");
const cart = require("../models/cart");
const { CashCollection } = require("../models/cashcollection");

// exports.getUserById = (req, res, next, id) => {
//   User.findById(id).exec((err, user) => {
//     if (err || !user) {
//       return res.status(400).json({
//         error: "user not found in database 1",
//       });
//     }
//     req.profile = user;
//     next();
//   });
// };

exports.getUserById = (req, res) => {
  User.findById(req.params.userId, (err, user) => {
    if (err) {
      res.status(500).send({
        message: err,
      });
    } else {
      res.status(200).send(user);
    }
  });
};

exports.createVendorCategory = (req, res) => {
  const category = new Category(req.body);
  category.save((error, cate) => {
    if (error) {
      return res.status(400).json({
        error: "not able to save category in DB",
      });
    }
    res.category = cate;
    res.json({ category });
  });
};
exports.getUser = (req, res) => {
  req.profile.salt = undefined;
  req.profile.encry_password = undefined;
  return res.json(req.profile);
};

exports.updateUser = (req, res) => {
  if (req.body.address && req.body.address.pincode) {
    Pin.findOne({ pincode: req.body.address.pincode }).exec((err, result) => {
      if (!result) {
        const newPin = new Pin({ pincode: req.body.address.pincode });
        newPin.save((err, response) => {
          if (err) {
            console.log(err);
          }
        });
      }
    });
  }
  User.findByIdAndUpdate(
    { _id: req.profile._id },
    { $set: req.body },
    { new: true, useFindAndModify: false },
    (err, user) => {
      console.log(err);
      if (err) {
        return res.status(400).json({
          error: "you are not authorised",
        });
      }
      user.salt = undefined;
      user.encry_password = undefined;
      res.json(user);
    }
  );
};

// updateUser details ;
exports.updateuserDetails = async (req, res, next) => {
  const { userid } = req.params;
  console.log(userid);
  const {
    username,
    location,
    address,
    email,
    phone_number,
    shop_name,
    max_due,
    vendor_category,
    role,
  } = req.body;

  try {
    const updateUser = await User.findOneAndUpdate(
      { _id: userid },
      {
        username: username,
        location: location,
        address: address,
        phone_number: phone_number,
        shop_name: shop_name,
        max_due: max_due,
        vendor_category: vendor_category,
        role: role,
        email: email,
      }
    );
    res.json(updateUser);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.userPurchaseList = (req, res) => {
  let status = req.query.status;
  Order.find({ user: req.profile._id })
    .populate("user", "_id username shop_name phone_number")
    .populate("products", "details numberOfItem cost status")

    .exec((err, order) => {
      if (err) {
        return res.status(400).json({
          error: "no orders in your account",
        });
      }
      if (status) {
        return res.json(order.filter((ord) => ord.status === status));
      }
      return res.json(order);
    });
};
exports.checkorderStock = async (req, res, next) => {
  if (req.body.status === req.order.status) {
    return res.status(400).json({
      error: `already ${req.body.status}`,
    });
  }
  if (req.body.status === "Accepted") {
    let list = [];

    await cart
      .find({
        _id: req.order.products,
      })
      .exec((err, cartDetails) => {
        // console.log(cartDetails[0].quantityArray, "5456456456456");
        if (err) {
          console.log(err);
        }

        const totalStock = [];
        cartDetails[0].quantityArray.forEach((product) => {
          // console.log(product, "product");
          totalStock.push(product);
        });
        cartDetails[0]._productIDArray.forEach((product) => {
          list.push(product);
        });
        console.log("1 ");
        Product.find({ _id: { $in: list } }, function (err, array) {
          let listDuplee = [];
          cartDetails[0]._productIDArray.forEach((product) => {
            listDuplee.push(product);
          });
          console.log("2 ");
          array.map((arr, i) => {
            if (JSON.stringify(listDuplee[i]) === JSON.stringify(arr._id)) {
              listDuplee[i] = arr.stock;
            }
          });
          console.log("3");
          let proceed = true;
          for (let i = 0; i < totalStock.length; i++) {
            if (listDuplee[i] < totalStock[i]) {
              proceed = false;
              return res.status(400).json({
                error: "Not enough stock",
              });
              break;
            }
          }
          if (proceed) {
            next();
          } else {
            return res.status(400).json({
              error: "Not enough stock",
            });
          }
        });
      });
  }
};
exports.pushOrderInPurchaseList = (req, res, next) => {
  if (req.body.status === "Accepted") {
    let purchases = [];
    purchases.push(req.order._id);
    // });
    User.findOneAndUpdate(
      { _id: req.order.user },
      { $push: { purchases: purchases } },
      { new: true },
      (err, purchases) => {
        if (err) {
          return res.status(400).json({
            error: "cannot purchase your item",
          });
        }
        next();
      }
    );
  } else {
    next();
  }
};

exports.updateCashCollection = async (req, res) => {
  // const fields = req.body;
  // const { Amount, Date, time, isCashCollected, orderId, userId } = fields;

  const newTanx = new CashCollection({
    Amount: req.body.Amount,
    Date: req.body.Date,
    time: req.body.time,
    isCashCollected: req.body.isCashCollected,
    orderId: req.body.orderId,
    userId: req.body.userId,
  });

  await newTanx.save(async (err, tanx) => {
    if (err) {
      return res.status(400).json({
        error: "failed to save order in DB",
      });
    }
    // console.log(newTanx);
    // console.log(req.body.userId, "userID");
    // console.log(req.body.Amount, "Amount");

    if (req.body.isCashCollected) {
      const findUser = await User.findOne({ _id: req.body.userId });
      const due_amount = findUser.due_amount;
      const update_Value = due_amount - req.body.Amount;
      console.log(due_amount, "due Amount");
      const UpdateAmount = { due_amount: update_Value };
      // console.log(findUser, "find user");
      // console.log(UpdateAmount, "update Amount");
      await findUser.updateOne(UpdateAmount);
    }
    res.json(newTanx);
  });
};

exports.updateDueAmount = (req, res) => {
  try {
    console.log(req.params.id); //prints undefined let updateRole;
    DueAmountData = {
      Amount: req.body.Amount,
      Date: req.body.Date,
      time: req.body.time,
      isCashCollected: req.body.isCashCollected,
      orderId: req.body.orderId,
      userId: req.body.userId,
    };
    CashCollection.findOneAndUpdate(
      req.param.id,
      DueAmountData,
      { upsert: true },
      function (err, resp) {
        if (err) {
          console.log(err);
          res.status(403).json({ message: "amount can't be update" });
        } else {
          res.status(200).json(resp);
          console.log(resp);
        }
      }
    );

    User.findOneAndUpdate(
      { userId: req.body.userId },
      {
        $set: { due_amount: req.body.Amount },
      }
    ).exec((user) => {
      console.log(user);
    });
  } catch (errors) {
    res.status(501).json({ message: errors });
  }
};

exports.cashcollectionByUser = (req, res) => {
  try {
    CashCollection.find({ userId: req.param.userId }, function (err, data) {
      if (err) {
        res.status(501).json(err);
      }
      res.status(200).json(data);
    });
  } catch (err) {
    console.log(err);
  }
};
