const mongoose = require("mongoose");

var Schema = mongoose.Schema;

const pin_spSchema = new Schema(
  {
    pincode: {
      type: String,
      required: "provide pincode",
    },
    percent_add: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("pin_sp", pin_spSchema);
