const mongoose = require("mongoose");
var { ObjectId } = mongoose.Schema;
var Schema = mongoose.Schema;

const DiscountSchema = new Schema(
  {
    code: {
      type: String,
      unique : true,
      trim: true,
      required : "provide discount code"
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      required : "provide description"
    },
    discount : {
        type : Number,
        trim : true,
        required : "provide discount"
    },
    order_limit: {
      type: Number,
      trim: true,
    },
    status : {
      type : Boolean,
      default : true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discount", DiscountSchema);
