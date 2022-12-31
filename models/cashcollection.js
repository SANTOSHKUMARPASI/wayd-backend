const mongoose = require("mongoose");
var { ObjectId } = mongoose.Schema;
var Schema = mongoose.Schema;

const cashCollectionSchema = new Schema(
  {
    Amount: {
      type: Number,
      required: true,
    },
    Date: {
      type: Date,
      default: Date.now(),
      // required: true,
    },
    time: {
      type: String,
      // required: true,
    },
    isCashCollected: {
      type: Boolean,
      required: true,
    },
    orderId: {
      type: ObjectId,
      ref: "Order",
    },
    userId: {
      type: String,
      // type: ObjectId,
      // ref: "User",
    },
  },
  { timestamps: true }
);

const CashCollection = mongoose.model("CashCollection", cashCollectionSchema);

module.exports = { CashCollection };
