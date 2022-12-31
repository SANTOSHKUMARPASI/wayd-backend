const mongoose = require("mongoose");
var Schema = mongoose.Schema;

const UserCartSchema = new Schema(
  {
    // _id : {
    //     type : Schema.Types.ObjectId,
    //     auto : true,
    //     required : true
    //   },
    _userID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    _productIDArray: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    details: [
      {
        id: { type: String },
        name: { type: String },
        grade: { type: String },
        price: { type: Number },
        Selectedquantity: { type: Number },
      },
    ],
    quantityArray: {
      type: [Number],
      required: true,
    },
    buy_DirectProduct: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    buy_DirectQuantity: {
      type: [Number],
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    numberOfItem: {
      type: Number,
      required: true,
      default: 0,
    },
    attached_order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
    attached_coupon: {
      type: Schema.Types.ObjectId,
      ref: "Discount",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", UserCartSchema);
