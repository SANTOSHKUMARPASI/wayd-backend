var mongoose = require("mongoose");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
var { ObjectId } = mongoose.Schema;
var Schema = mongoose.Schema;
var userSchema = new Schema(
  {
    username: {
      type: String,
      maxlength: 32,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    address: {
      pincode: { type: String },
      area: { type: String },
      street: { type: String },
    },

    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    phone_number: {
      type: Number,
      trim: true,
      required: true,
    },
    shop_name: {
      type: String,
    },
    due_amount: {
      type: Number,
      default: 0,
    },
    max_due: {
      type: Number,
      required: true,
      default: 0,
    },
    d_product: [
      {
        name: { type: String },
        minprice: { type: String },
        maxprice: { type: String },
      },
    ],
    transport_cost: {
      type: Number,
    },
    order_frequency: {
      type: Number,
    },
    vendor_category: {
      type: String,
      enum: ["Juice", "Grocery", "Street"],
    },
    role: {
      type: Number,
      default: 0,
    },
    isShipper: {
      type: Boolean,
    },
    purchases: [{ type: String }],
    origanization: { type: ObjectId, ref: "Organization", required: true },
    photo: {
      type: String,
    },
    encry_password: {
      type: String,
      required: true,
    },
    salt: String,
  },

  { timestamps: true }
);

userSchema
  .virtual("password")
  .set(function (password) {
    this._password = password;
    this.salt = uuidv4();
    this.encry_password = this.securePassword(password);
  })
  .get(function () {
    return this._password;
  });

userSchema.methods = {
  authenticate: function (plainpassword) {
    return this.securePassword(plainpassword) === this.encry_password;
  },

  securePassword: function (plainpassword) {
    if (!plainpassword) return "";
    try {
      return crypto
        .createHmac("sha256", this.salt)
        .update(plainpassword)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
};

module.exports = mongoose.model("User", userSchema);
