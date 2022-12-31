const express = require("express");
const router = express.Router();
const Product = require("../../models/product");

router.get("/product/photo/:productId", (req, res) => {
  Product.findOne({ _id: req.params.productId }).then(product => {
    console.log(product);
    if (product) {
      res.sendFile(__dirname + "/" + product.photo);
    } else {
      return res.status(400).json({ photo: "not found" });
    }
  });
});
module.exports = router;
