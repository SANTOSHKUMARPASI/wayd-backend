const mongoose = require("mongoose");

var Schema = mongoose.Schema;

const photoSchema = new Schema(
  {
    photo: {
      data: Buffer,
      contentType: String,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("photo", photoSchema);
