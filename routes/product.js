const express = require("express");
const router = express.Router();
const multer = require("multer");
const Product = require("../models/product");
const Aws = require("aws-sdk");
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./public/products/");
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const s3 = new Aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY, // accessKeyId that is stored in .env file
  secretAccessKey: process.env.AWS_SECRET_KEY, // secretAccessKey is also store in .env file
});

const upload = multer({ storage: storage });
const {
  getProductById,
  createProduct,
  getProduct,
  photo,
  deleteProduct,
  updateProduct,
  getAllProducts,
  getAllUniqueCategories,
  createProductPackage,
  updateProductPackage,
  deleteProductPackage,
  stockInOut,
  stockImages,
  updateStockLogById,
  pushStockinProductList,
  pushStockDaily,
} = require("../controllers/product");
const {
  isSignedIn,
  isAuthenticated,
  isAdmin,
} = require("../controllers/authentication");
const { getUserById } = require("../controllers/user");
const { AlterProductPriceForpincode } = require("../controllers/pin_sp");
const { getProcureById } = require("../controllers/order");

//all of params
router.param("userId", getUserById);
router.param("productId", getProductById);
router.param("procureId", getProcureById);

//all of actual routes
router.get("/product/:productId", getProduct);
router.get(
  "/products",
  isSignedIn,
  isAuthenticated,
  AlterProductPriceForpincode,
  getAllProducts
);

router.delete(
  "/product/:productId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteProduct
);
router.put(
  "/product/:productId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateProduct,
  pushStockDaily,
  upload.single("photo"),
  (req, res) => {
    Product.findById(req.params.productId).then((product) => {
      product.photo = req.file.originalname;

      product
        .save()
        .then(() => res.json("image uploaded"))
        .catch((err) => res.status(400).json(`Error: ${err}`));
    });
  }
);
router.put(
  "/product/:productId/package/:userId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  createProductPackage
);
router.put(
  "/product/stock/update/:productId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  // stockInOut
  pushStockinProductList
);

router.put(
  "/product/:productId/stock/:stockId/update",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateStockLogById
);
router.patch(
  "/product/update/:productId/package",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateProductPackage
);
router.delete(
  "/product/:packageId/package/delete",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteProductPackage
);
router.get("/allcategories", getAllUniqueCategories);

router.post("/product/create", upload.single("photo"), (req, res) => {
  console.log(req.file, "req.file"); // req.file

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // bucket that we made earlier
    Key: req.file.originalname, // Name of the image
    Body: req.file.buffer, // Body which will contain the image in buffer format
    ACL: "public-read-write", // defining the permissions to get the public link
    ContentType: "image/jpeg", // Necessary to define the image content-type to view the photo in the browser with the link
  };

  // uplaoding the photo using s3 instance and saving the link in the database.

  const product = new Product({
    name: req.body.name,
    isPiece: req.body.ispiece,
    description: req.body.description,
    category: req.body.category,
    grade: req.body.grade,
    stock: req.body.stock,
    price: req.body.price,
    photo: req.file.originalname,
  });

  s3.upload(params, (error, data) => {
    if (error) {
      res.status(500).send({ err: error }); // if we get any error while uploading error message will be returned.
    }

    // If not then below code will be executed

    console.log(data); // this will give the information about the object in which photo is stored

    // saving the information in the database.
    const { name, description, price, category, stock, grade } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Please include product name",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        error: "Please include image",
      });
    }

    if (!description) {
      return res.status(400).json({
        error: "Please include product description",
      });
    }

    if (!price) {
      return res.status(400).json({
        error: "Please include product price",
      });
    }

    if (!category) {
      return res.status(400).json({
        error: "Please include product category",
      });
    }

    if (!stock) {
      return res.status(400).json({
        error: "Please include product stock",
      });
    }
    if (!grade) {
      return res.status(400).json({
        error: "Please include product grade",
      });
    }

    product
      .save((error, product) => {
        if (error) {
          res.status(400).json({
            error: " saving product to DB is failed",
          });
        }
        res.json(product);
      })
      .catch((err) => {
        res.send({ message: err });
      });
  });

  // ----------------------------------------------------------------------------
});

router.post("/multiple-file-upload", (req, res) => {});

module.exports = router;
