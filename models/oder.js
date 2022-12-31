const mongoose = require("mongoose");
var { ObjectId } = mongoose.Schema;
var Schema = mongoose.Schema;

const productCartSchema = new Schema({
  product: {
    type: ObjectId,
    ref: "product",
  },
  package: {
    type: String,
  },
  count: { type: Number },
  name: {
    type: String,
  },
  total: { type: Number },
});
const ProductCart = mongoose.model("ProductCart", productCartSchema);

const orderSchema = new Schema(
  {
    products: {
      type: ObjectId,
      ref: "Cart",
    },
    transaction_id: {},
    cart_Type: {
      type: String,
    },
    amount: {
      type: Number,
    },
    date: { type: String },
    address: { type: String },
    status: {
      type: String,
      default: "Placed",
      enum: [
        "Placed",
        "Accepted",
        "Cancelled",
        "Processing",
        "Shipped",
        "Delivered",
        "Recieved",
      ],
    },
    payment_status: {
      type: String,
      default: "UNPAID",
    },
    originalAmount: {
      type: Number,
    },
    coupon: {
      type: ObjectId,
      ref: "Discount",
    },
    discountedAmount: {
      type: Number,
    },
    shippedDate: { type: Date },
    deliveredDate: { type: Date },
    remark: {
      type: String,
    },
    delivery: {
      type: ObjectId,
      ref: "User",
    },
    orderReceivedAmount: {
      type: Number,
    },
    orderRemainingAmount: {
      type: Number,
    },
    updated: Date,
    user: {
      type: ObjectId,
      ref: "User",
    },
    userType: {
      type: String,
      // enum: ["Supplier", "Customer"],
    },
    selectedCustomer: {
      type: ObjectId,
      ref: "User",
    },

    //Get order lifecycle
    Placed: {
      type: String,
      default: "N/A",
      ref: "date",
    },
    Accepted: {
      type: String,
      default: "N/A",
    },
    cancelled: {
      type: String,
      default: "N/A",
    },
    shipped: {
      type: String,
      default: "N/A",
    },
    processing: {
      type: String,
      default: "N/A",
    },
    recieved: {
      type: String,
      default: "N/A",
    },
    delivered: {
      type: String,
      default: "N/A",
    },
  },

  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order, ProductCart };
