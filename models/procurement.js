const mongoose = require("mongoose");

var Schema = mongoose.Schema;

const procurementSchema = new Schema(
  {
    list: [{
      _id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      count: {
        type: String,
        require: true
      },
      extra_stock: {
        type: Number,
        default : 0
      },
      price_generated : {
          type : Boolean,
          default : false
      }
    }],
    date : {
      type : String,
      require : true
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("procurement", procurementSchema);
