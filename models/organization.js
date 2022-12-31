const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var { ObjectId } = mongoose.Schema;

const Origanizationschema = new Schema(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    ownerDetails: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    limits: {
      admin: {
        users: [{ type: ObjectId, ref: "User" }],
        limit: { type: Number, required: true },
      },
      customer: {
        users: [{ type: ObjectId, ref: "User" }],
        limit: { type: Number, required: true },
      },
      delivery: {
        users: [{ type: ObjectId, ref: "User" }],
        limit: { type: Number, required: true },
      },
      supplier: {
        users: [{ type: ObjectId, ref: "User" }],
        limit: { type: Number, required: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

const Organization = mongoose.model("Organization", Origanizationschema);
module.exports = { Organization };
