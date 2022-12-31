const mongoose = require("mongoose");
var { ObjectId } = mongoose.Schema;
var Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    origanization: { type: ObjectId, ref: "Organization" },
    packages: [
      {
        value: String,
        stock: { type: Number },
        price: { type: Number },
        package_type: { type: String },
      },
    ],
    grade: { type: String, enums: ["A", "B", "C"], required: true },
    count: { type: Number },
    total: { type: Number },
    isPiece: { type: Boolean, default: "false" },
    price: {
      type: Number,
      maxlength: 32,
      trim: true,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    photo: {
      type: String,
    },
    stock_daily: [
      {
        date: { type: String },
        extra_stock: { type: Number, default: 0 },
        claimed_price: { type: Number, default: 0 },
        claimed_stock: { type: Number, default: 0 },
        actual_stock: { type: Number, default: 0 },
        sold: { type: Number, default: 0 },
        selling_price: { type: Number, default: 0 },
        sampled_stock: { type: Number, default: 0 },
        waste_stock: { type: Number, default: 0 },
        claimed_total_price: { type: Number, default: 0 },
        updatedBy: {
          type: ObjectId,
          ref: "User",
        },
      },
    ],
    stock_images: [
      {
        photos: { type: Array },
        date: { type: String, default: new Date() },
        stockIn: { type: Number, default: 0 },
        wastage: { type: Number, default: 0 },
        samples: { type: Number, default: 0 },
        sold: { type: Number, default: 0 },
        addedBy: { type: String },
        name: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
