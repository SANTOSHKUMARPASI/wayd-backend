const Discount = require("../models/discount");
const Procure = require("../models/procurement");
const Product = require("../models/product");
const Pin = require("../models/pin_sp");
const formidable = require("formidable");
const User = require("../models/user");
const fast2sms = require("fast-two-sms");
const moment = require("moment");
const cart = require("../models/cart");
const { Order } = require("../models/oder");
const { updateStock } = require("./product");
const { response } = require("express");
const mongoose = require("mongoose");
const user = require("../models/user");
const product = require("../models/product");

exports.getOrderById = (req, res, next, id) => {
  Order.findById(id)
    // .populate("user", "_id username shop_name phone_number")
    .exec((err, order) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          error: "no order found",
        });
      }
      req.order = order;
      next();
    });
};
exports.getProcureById = (req, res, next, id) => {
  Procure.findById(id)
    // .populate("user", "_id username shop_name phone_number")
    .exec((err, proc) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          error: "no procuremnt list found",
        });
      }
      req.procurement = proc;
      next();
    });
};
exports.CouponVerification = (req, res, next) => {
  // req.body.order.user = req.order.user;

  let coupon = req.order.coupon ? req.order.coupon : req.body.coupon;
  if (coupon && req.body.status === "Accepted") {
    Discount.findOne({ _id: coupon }).exec((err, disc) => {
      if (!disc) {
        return res.status(400).json({
          error: "coupon does not exist",
        });
      }
      if (disc.order_limit) {
        User.findById({ _id: req.order.user }).exec((err, user) => {
          if (!user) {
            return res.status(400).json({
              error: "User not found",
            });
          }
          // console.log((user.purchases.length + 1) % disc.order_limit === tr,"what")
          let value = (user.purchases.length + 1) % disc.order_limit === 0;
          if (value === false) {
            return res.status(400).json({
              error: `discount not applicable`,
            });
          } else {
            req.coupon = disc;
            req.smsuser = user;
            console.log("3");
            next();
          }
        });
      }
    });
  } else {
    User.findById({ _id: req.order.user }).exec((err, user) => {
      console.log(err);
      if (!user) {
        return res.status(400).json({
          error: "User not found",
        });
      }
      req.smsuser = user;
      console.log("3");
      next();
    });
  }
};
exports.discountverify = async (req, res, next) => {
  const cartDetails = await cart
    .find({
      _userID: req.user._id,
      status: "YET_TO_CHECKOUT",
      status: "YET_TO_CHECKOUT",
    })
    .exec();
  if (!cartDetails.length > 0) {
    res.status(404).json({
      error: "Cart is empty",
    });
  } else if (cartDetails.length > 0 && !cartDetails[0].numberOfItem > 0) {
    res.status(404).json({
      error: "Cart is empty",
    });
  } else {
    if (req.params.coupon) {
      Discount.findOne({ _id: req.params.coupon }).exec((err, disc) => {
        if (!disc) {
          return res.status(400).json({
            error: "coupon does not exist",
          });
        }
        if (disc.order_limit) {
          User.findById({ _id: req.user._id }).exec((err, user) => {
            if (!user) {
              return res.status(400).json({
                error: "User not found",
              });
            }
            // if ((user.purchases.length + 1) % disc.order_limit === 0)
            if (!user.purchases.length > disc.order_limit) {
              return res.status(400).json({
                error: `discount not applicable minimus order limit is ${disc.order_limit}`,
              });
            }
            req.discount = disc;
            req.cartDetails = cartDetails;
            next();
          });
        }
      });
    } else {
      req.cartDetails = cartDetails;
      next();
    }
  }
};

exports.createOrder = async (req, res) => {
  // const cartDetails = req.cartDetails;
  const cartDetails = await cart
    .find({
      _userID: req.user._id,
      status: "YET_TO_CHECKOUT",
    })
    .exec();
  const fastSms = async () => {
    var options = {
      authorization: process.env.SMS_API,
      message: `Your Order is Placed with ${cartDetails[0].numberOfItem} of Rs.${cartDetails[0].cost}
regards
Way-D,Pohulabs`,
      numbers: [req.semuser.phone_number],
    };
    // }
    await fast2sms.sendMessage(options);
  };
  let value = {
    products: cartDetails[0]._id,
    amount: cartDetails[0].cost,
    user: cartDetails[0]._userID,
    originalAmount: cartDetails[0].cost,
    userType: req.body.userType,
selectedCustomer: req.body.customerId,
    address:
      req.user.address.area +
      "," +
      req.user.address.street +
      "," +
      req.user.address.pincode,
    coupon: cartDetails[0].attached_coupon
      ? cartDetails[0].attached_coupon
      : null,
  };
  console.log(value, "value");
  // supplier updateStock
  if (req.body.userType === "Supplier") {
    const order = await new Order(value);
    order.save((err, order) => {
      order.status = "Delivered";
      if (err) {
        return res.status(400).json({
          error: "failed to save order in DB",
        });
      }
      if (req.body.sms) {
        fastSms();
      }
      cart
        .findOneAndUpdate(
          { _userID: req.user._id, status: "YET_TO_CHECKOUT" },
          {
            $set: { attached_order: order._id, status: "Delivered" },
          }
        )
        .exec(() => {});

      res.json(order);
    });

    await cart.find({ _id: value.products }).exec((err, cartdetails) => {
      // let idArray = [];
      let idsArray = cartdetails[0]._productIDArray;
      console.log(cartdetails[0]._productIDArray, "dfdsfsdfsdfds");
      for (let i = 0; i < idsArray.length; i++) {
        Product.findByIdAndUpdate(
          { _id: cartdetails[0]._productIDArray[i] },
          {
            $inc: {
              stock: cartdetails[0].quantityArray[i],
            },
            $set: { status: "Delivered" },
          }
        ).exec((err, updateStock) => {
          if (err) {
            res.status(501).json(err);
          }
          updateStock.save();
          // console.log(updateStock, "updateStock product 565645645564564");
        });
      }
    });
  }

  const order = await new Order(value);
  order.save((err, order) => {
    if (err) {
      return res.status(400).json({
        error: "failed to save order in DB",
      });
    }
    if (req.body.sms) {
      fastSms();
    }
    cart
      .findOneAndUpdate(
        { _userID: req.user._id, status: "YET_TO_CHECKOUT" },
        {
          $set: { attached_order: order._id, status: "YET_TO_CONFIRM" },
        }
      )
      .exec(() => {});
    res.json(order);
  });
};
exports.getAllOrders = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 8;
  sortBy = req.query.limit ? parseInt(req.query.limit) : "_id";
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  Order.find()
    .populate("user")
    .populate("products", "details numberOfItem cost status vendor_category")
    .populate("selectedCustomer")
    .populate("delivery")
    .sort({ createdAt: -1 })
    .exec((err, order) => {
      if (err) {
        return res.status(400).json({
          error: "no orders found in DB",
        });
      }
      const results = {};
      if (endIndex < order.length) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      }
      results.total = {
        total_records: order.length,
      };
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      }
      results.results = order.slice(startIndex, endIndex);
      if (!req.query.limit) {
        res.json(order);
      } else {
        res.json(results);
      }
    });
};

exports.getOrderStatus = (req, res) => {
  let order = req.order;
  console.log(order);
  let array = [
    "Placed",
    "Accepted",
    "Cancelled",
    "Shipped",
    "Processing",
    "Recieved",
    "Delivered",
  ];
  let index1 = array.indexOf(order.status);
  array.splice(0, index1);
  res.json(array);
};

//handle GET at api/order/userOrdersHistory to Get all user's orders
exports.userOrdersHistory = (req, res) => {
  let userId = req.user.id;
  console.log(userId);

  Order.find({ user: userId })
    .sort({ date: -1 })
    .populate({
      path: "products",
      model: "product",
      populate: {
        path: "user",
        model: "user",
        select: "username",
      },
    })
    .populate("address")
    .exec((err, order) => {
      if (err) {
        res.status(400).json({ message: "Couldn't find cart", err });
      } else {
        res.status(200).json({ message: "All user's orders", order });
      }
    });
};

exports.getAllUniqueCategories = () => {
  Product.distinct("category", {}, (err, category) => {
    if (err) {
      return res.status(400).json({
        error: "category not found",
      });
    }
    res.json(category);
  });
};
exports.updateStatus = async (req, res) => {
  const order = req.order;
  console.log(order, "orders");
  order.status = req.body.status;
  // update order staus Accepted
  if (req.body.status === "Accepted") {
    console.log("545646546545");
    order.amount = req.totalAmount;
    console.log(order.amount, "order.amount");
    order.originalAmount = req.totalAmount;
    console.log(order.originalAmount, "order original amount ");
    order.address = req.body.address ? req.body.address : req.user.location;
    //
    order.Accepted = moment(new Date()).format("LLL");
    /// -------------------------------------------------------
    if (req.order.userType === "Customer") {
      await cart.find({ _id: req.order.products }).exec((err, cartdetails) => {
        // let idArray = [];
        let idsArray = cartdetails[0]._productIDArray;
        // console.log(cartdetails[0]._productIDArray, "dfdsfsdfsdfds");

        for (let i = 0; i < idsArray.length; i++) {
          // console.log(i, "intrations");
          Product.findByIdAndUpdate(
            { _id: cartdetails[0]._productIDArray[i] },
            {
              $inc: {
                stock: -cartdetails[0].quantityArray[i],
                sold: cartdetails[0].quantityArray[i],
              },
            }
          ).exec((err, updateStock) => {
            if (err) {
              res.status(501).json(err);
            }
            updateStock.save();
            console.log(updateStock, "updateStock product 565645645564564");
          });
        }
      });
    }
  }

  order.originalAmount = req.totalAmount;
  let coupon = req.order.coupon ? req.order.coupon : req.body.coupon;
  if (coupon && req.body.status === "Accepted") {
    let disc = req.coupon;
    let discount = disc.discount;
    order.originalAmount = order.amount;
    let discountValueAmount =
      parseInt(req.totalAmount) - parseInt(req.coupon.discount);
    order.discountedAmount = discountValueAmount;
    order.amount = discountValueAmount;
    order.coupon = coupon;
    order.Accepted = moment(new Date()).format("LLL");
  }
  //
  //-----------------------------------------------------------------------------------
  // if (req.body.status === "Processing") {
  //   // console.log("1212322323223");
  //   // const updateOrderStatus = await Order.findOneAndUpdate(
  //   //   { _id: req.param.orderId },
  //   //   {
  //   //     $set: { status: req.body.status },
  //   //   }
  //   // ).exec((err, updateStatus) => {
  //   //   if (err) {
  //   //     res.status(501).json({ message: err.message });
  //   //   }
  //   //   console.log(updateStatus.message);
  //   // });
  //   // console.log(updateOrderStatus, "update status");
  //   // console.log("procssing")
  //   order.amount = req.totalAmount;
  //   console.log(order.amount, "order.amount");
  //   order.originalAmount = req.totalAmount;
  //   console.log(order.originalAmount, "order original amount ");
  //   order.address = req.body.address ? req.body.address : req.user.location;
  //   order.processing = moment(new Date()).format("LLL");
  // }
  //

  //

  if (req.body.status === "Cancelled") {
    order.cancelled = moment(new Date()).format("LLL");
  }

  if (req.body.status === "Shipped") {
    order.shipped = moment(new Date()).format("LLL");
  }

  if (req.body.status === "Recieved") {
    order.recieved = moment(new Date()).format("LLL");
  }
  //
  const fastSms = () => {
    User.findById({ _id: req.order.user }).exec((err, user) => {
      if (!user) {
        console.log(err);
        return res.status(400).json({
          error: "User not found",
        });
      }

      var options = {
        authorization: process.env.SMS_API,
        message: `Your Order ${req.order._id} of Rs.${
          req.order.originalAmount
        } is ${req.body.status}
  regards,
  Way-D,Pohulabs
  ${new Date()}`,

        numbers: [user.phone_number],
      };
      // }
      fast2sms.sendMessage(options);
    });
  };

  let status = req.body.status;
  if (status === "Delivered") {
    let payment_status = req.body.payment_status;
    let amount = req.body.amount;

    var orders = await Order.find().populate("products");
    const selectCustomerId = orders.selectedCustomer;

    // let userId = req.user.id;
    let orderIndex = req.params.orderId;
    console.log("orderIndex", orderIndex);
    let cost;
    let userid;

    orders.filter((order) => {
      if (order._id == orderIndex) {
        cost = order["products"]["cost"];
        userid = order.user;
      }
    });

    let remainingBalance = cost - req.body.amount;
    order.payment_status = payment_status;
    order.orderReceivedAmount = amount;
    order.orderRemainingAmount = remainingBalance;

    order.delivered = moment(new Date()).format("LLL");

    // update Due amount
    const findUser = await User.findOne({ _id: selectCustomerId });
    const due_amount = findUser.due_amount;
    const update_Value = due_amount + remainingBalance;
    const UpdateAmount = { due_amount: update_Value };
    await findUser.updateOne(UpdateAmount);
  }
  order.save((err, UpdateOrder) => {
    if (err) {
      console.log(err);
      return res.status(400).json({
        error: "failed to update the order status",
      });
    }
    if (req.body.sms) {
      fastSms();
    }
    res.json(UpdateOrder);
  });
};

exports.updateDeliveyOrder = (req, res) => {
  const order = req.order;
  console.log(order, "order");
  req.order.payment_status === "PAID";

  if (req.order.payment_status === "PAID") {
    Order.findOneAndUpdate(
      {
        _id: req.order._id,
        payment_status: req.order.payment_status,
        amount: req.order.amount,
      },
      {
        $set: { status: "DELIVERED", payment_status: "PAID" },
      }
    ).exec((err, success) => {
      console.log(success);
    });
  }

  order.save((err, UpdateOrder) => {
    if (err) {
      console.log(err);
      return res.status(400).json({
        error: "failed to update the order status",
      });
    }
    if (req.body.sms) {
      fastSms();
    }
    res.json(UpdateOrder);
    res.sent("Order Delivered");
  });
};

exports.updatePrice = async (req, res, next) => {
  let status = req.body.status;
  if (status === "Accepted") {
    const cartID = await cart.find({ _id: req.order.products });
    // console.log(cartID[0], "product Array id");

    let ids = cartID[0]?._productIDArray;
    // console.log(ids, "ids");
    Product.find({ _id: { $in: ids } }, function (err, array) {
      cartID[0]?._productIDArray.forEach((product) => {
        ids.push(product);
      });
      let counts = [];
      cartID[0]?.quantityArray.forEach((product) => {
        counts.push(product);
      });
      array.map((arr) => {
        let position = ids.indexOf(arr._id);
        if (position !== -1) {
          ids[position] = arr.price;
        }
      });
      let amountVal = [];
      for (let i = 0; i < array.length; i++) {
        let productPrice = parseInt(ids[i]) * parseInt(counts[i]);
        amountVal.push(productPrice);
      }

      let sum = amountVal.reduce((a, b) => {
        return a + b;
      });
      cart
        .findOneAndUpdate(
          {
            _userID: req.order.user,
            status: "YET_TO_CONFIRM",
            attached_order: req.order._id,
          },
          {
            $set: { cost: Math.ceil(sum), status: "YET_TO_DELIVER" },
          }
        )
        .exec((err, success) => {
          if (err) {
            res.status(402).json({
              error: "not able to save status",
            });
          }
        });
      req.totalAmount = Math.ceil(sum);
      next();
    });
  } else {
    next();
  }
};
// update

exports.checkStatusValidation = (req, res, next) => {
  let status = req.body.status;
  let order = req.order;
  if (!status) {
    return res.status(404).json({
      error: "status is required",
    });
  }
  if (order.status === "Cancelled") {
    return res.status(404).json({
      error: "The Order has been cancelled",
    });
  }
  const statusList = Order.schema.path("status").enumValues;
  let index1 = statusList.indexOf(status);
  let index2 = statusList.indexOf(order.status);
  if (status !== "Cancelled") {
    if (index1 <= index2) {
      return res.status(404).json({
        error: "status cannot be reverted back once it it Accepted",
      });
    }
  }
  next();
};

// order they are ready to shipping
exports.getDeliveryOrders = (req, res) => {
  // var status = req.query.status;
  // let order = req.order;
  // if (status === "Shipped") {
  Order.find({ status: "Shipped" })
    .populate("user", "_id username shop_name phone_number")
    .populate("products", "details numberOfItem cost status")
    .populate("address", "adress of order")
    .exec((err, order) => {
      res.json(order);
    });
  // }
};

exports.getOrder = (req, res) => {
  Order.findOne({ _id: req.order._id })
    .populate("coupon", "_id code")
    .populate("user", "_id username shop_name phone_number vendor_category address  ")
    .populate("products", "details numberOfItem cost status")
    .populate("selectedCustomer", "_id username shop_name phone_number vendor_category address ")
    .exec((err, order) => {
      res.json(order);
    });
};

exports.deleteOrder = (req, res) => {
  let order = req.order;
  order.remove((err, deletedOrder) => {
    if (err) {
      return res.status(400).json({
        error: "failed to delete the order",
      });
    }
    res.json({
      message: "deleted successfully",
    });
  });
};

exports.ProcurementList = async (req, res) => {
  let orderList = req.body.order_list;

  let Id = req.params.id;
  // const array = await Order.find({ _id: { $in: orderList } });
  const array = await Order.find({ _id: Id });
  console.log(array, "array");
  let procurement = [];
  let procurements = [];
  let ConditionStatus = true;
  console.log(procurement, "procurement 1 ");
  console.log(procurements, "procurements 2");

  let cartID = array["products"];
  console.log(cartID, "cartID");
  const arrayMapping = async (next) =>
    await array.map(async (arr, index) => {
      const products = await cart.find({ _id: arr.products });
      console.log(products, "products ");
      for (let i = 0; i < products[0].details.length; i++) {
        let insideproduct = products[0].details[i];
        console.log(insideproduct);
        procurement.push({
          _id: insideproduct._id.toString(),
          name: insideproduct.name,
          count: insideproduct.Selectedquantity,
        });
      }
      if (arr.status !== "Placed") {
        res.status(402).json({
          error: "List is genenated only for Placed Orders",
        });
      }
      if (array.length - 1 === index) {
        next();
      }
    });

  const duplicate = (id) => {
    let values = procurements.filter((proc) => proc._id === id);
    if (values.length > 0) {
      return true;
    }
    return false;
  };
  const procureThis = (next) => {
    console.log(procurements, procurement);
    procurement.forEach((procure, index) => {
      if (duplicate(procure._id)) {
        let pos = procurements
          .map(function (e) {
            return e._id;
          })
          .indexOf(procure._id);
        procurements[pos].count += procure.count;
      } else {
        procurements.push({
          _id: procure._id,
          name: procure.name,
          count: procure.count,
        });
        console.log(procurement, "procurement");
        console.log(procurements, "procurements");
      }
    });
    next();
  };

  let date = moment(new Date()).format("YYYY MM DD").replace(/ /g, "-");
  arrayMapping(() => procureThis(() => finalCallback()));
  const finalCallback = () => {
    Procure.findOne({ date: date }).exec((err, found) => {
      if (!found) {
        const procure = new Procure({
          list: procurements,
          date: date,
        });
        procure.save((error, proc) => {
          if (error) {
            console.log(error);
          }
        });
      }
    });
    res.json(procurements);
  };
};

exports.GetProcurementList = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 8;
  sortBy = req.query.limit ? parseInt(req.query.limit) : "_id";
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  Procure.find()
    .sort({ createdAt: -1 })
    .exec((err, proc) => {
      if (err) {
        return res.status(400).json({
          error: "no list found in DB",
        });
      }
      const results = {};
      if (endIndex < proc.length) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      }
      results.total = {
        total_records: proc.length,
      };
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      }

      results.results = proc.slice(startIndex, endIndex);
      if (!req.query.limit) {
        res.json(proc);
      } else {
        res.json(results);
      }
    });
};

//assign delivey Boy
exports.assigndelivey = (req, res, id) => {
  let status = req.body.status;
  if (status === "Shipped") {
    Order.findOneAndUpdate(
      { _id: req.params.orderid },
      {
        $set: { delivery: req.body.delivery, status: status },
      }
    ).exec((err, orders) => {
      if (err) {
        console.log(err, "err");
      }
      orders.save();
      res.json(orders);
    });
  } else {
    res.status(403).json({
      message: "Placed Status Can be reverted",
    });
  }
};
// Delivery to vender
exports.deliverySucess = async (req, res) => {
  if (req.body.status === "Delivered") {
    let status = req.body.status;
    let payment_status = req.body.payment_status;
    let amount = req.body.amount;

    var orders = await Order.find().populate("products");
    // console.log(orders, "orders");
    const selectedCustomer = orders.selectedCustomer;

    // let userId = req.user.id;
    let cost = orders[0]["products"]["cost"];

    let remainingBalance = cost - req.body.amount;
    console.log(remainingBalance, "reamincost");

    let orderId = req.params.orderid;
    //  update user
    const findUser = await User.findOne({ _id: selectedCustomer });
    const due_amount = findUser.due_amount;
    const update_Value = due_amount + remainingBalance;
    console.log(due_amount, "due Amount");
    const UpdateAmount = { due_amount: update_Value };
    // console.log(findUser, "find user");
    // console.log(UpdateAmount, "update Amount");
    await findUser.updateOne(UpdateAmount);

    Order.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          status: status,
          payment_status: payment_status,
          orderReceivedAmount: amount,
          orderRemainingAmount: remainingBalance,
          delivered: moment(new Date()).format("LLL"),
        },
      },
      { upsert: true, populate: { path: "products" } }
    ).exec((err, orders) => {
      console.log(err, "err");
      res.json(orders);
      console.log(orders, "orders");
      console.log(orders, "orders");
    });
  } else {
    res.status(403).json({
      message: "ordered Status Can be reverted",
    });

    if (cost === req.body.amount && payment_status === "PAID") {
      res.status(200).json({
        Message: "Your Order Delivery Sucessfully No Due",
      });
      console.log("your Delivery is not Completed");
    } else {
      console.log("your Delivery is not Completed");
    }

    if (cost !== req.body.amount && payment_status === "PAID") {
      res.status(200).json({
        message: `your order Deliver Sucessfully your due amount is ${remainingBalance}`,
      });
    } else {
      console.log("your payment is not completed ");
    }
  }
};

//Get order lifecycle
exports.getOrderLifecycle = (req, res) => {
  // OrderLifecycle.findOne({ _id: req.order._id })
  Order.findOne(
    { _id: req.params.id },
    {
      status: 1,
      payment_status: 1,
      Placed: 1,
      Accepted: 1,
      cancelled: 1,
      shipped: 1,
      processing: 1,
      recieved: 1,
      delivered: 1,
    }
  ).exec((err, order) => {
    if (err) {
      return res.status(400).json({
        error: "Order lifecycle not found",
      });
    }
    res.json(order);
  });
};

// get delivey orders by userid
exports.getDeliveryorderByUserId = async (req, res) => {
  const userid = req.param.userid;

  await Order.findOne({ delivery: userid }).exec((err, order) => {
    if (err) {
      res.status(501).json(err);
    }
    res.status(201).json(order);
    console.log(order);
  });
};
