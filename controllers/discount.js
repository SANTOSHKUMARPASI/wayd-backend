// const Product = require("../models/product");
const Discount = require("../models/discount");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");
const { json } = require("body-parser");
// const product = require("../models/product");

exports.getCOuponById = (req, res, next, id) => {
  Discount.findById(id)
    .populate("Category")
    .exec((error, coupon) => {
      if (error) {
        return res.status(400).json({
          error: " Coupon Not Found",
        });
      }
      req.coupon = coupon;
      next();
    });
};

exports.createDiscount = (req, res) => {
  // let code = req.body.code;
  // let description = req.body.description;
  // let order_limit = req.body.order_limit;
  // let status = req.body.status;
  // let discount = req.body.discount;

  // const fields = { code, description, order_limit, status, discount };
  console.log(fields);

  let form = new formidable.IncomingForm();
  form.keepExtensions = true;

  form.parse(req, (err, fields, file) => {
    if (err) {
      return res.status(400).json({
        error: "problem with images",
      });
    }
    const { code, description, order_limit, status, discount } = fields;

    if (!code || !description || !discount) {
      return res.status(400).json({
        error: "Please include code description and discount",
      });
    }

    //restrictions on field
    const newDiscount = new Discount(fields);
    //handle files here

    newDiscount.save((error, discount) => {
      if (error) {
        res.status(400).json({
          error: "savibg discount to DB is failed",
        });
      }
      res.json(discount);
    });
  });
};

exports.getAllDiscounts = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 8;
  sortBy = req.query.limit ? parseInt(req.query.limit) : "_id";
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  Discount.find()
    .sort({ createdAt: -1 })
    .exec((err, discount) => {
      if (err) {
        return res.status(400).json({
          error: "no discounts found in DB",
        });
      }
      const results = {};
      if (endIndex < discount.length) {
        results.next = {
          page: page + 1,
          limit: limit,
        };
      }
      results.total = {
        total_records: discount.length,
      };
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit,
        };
      }

      results.results = discount.slice(startIndex, endIndex);
      if (!req.query.limit) {
        // res.json(discount);
        // let count = req.user.purchases.length
        // console.log(count)
        // let finalArray = []
        // discount.filter(result => {
        //   let value = count % result.order_limit === 0
        //   console.log(value)
        //     if(value) {
        //       finalArray.push(result)
        //     }
        // })
        if (req.user.role === 1) {
          res.json(discount);
        } else {
          res.json(discount);
        }
      } else {
        res.json(results);
      }
    });
};
