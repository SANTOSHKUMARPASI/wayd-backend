require("dotenv").config();
const User = require("../models/user");
const { check, validationResult } = require("express-validator");
var express = require("express");
var router = express.Router();

/**
 * @swagger
 * /api/signin:
 *  post:
 *    description: SignIn request
 *    tags: [signin]
 *    requestBody:
 *       required: true
 *    content:
 *         application/json:
 *           schema:
 *             $ref: './models/user.js'
 *    responses:
 *      '200':
 *        description: A successful response with token
 */
const {
  signout,
  signup,
  signin,
  isSignedIn,
  getAllUsers,
  isthere,
  isAuthenticated,
  isAdmin,
  isShipper,
  createShipper,
} = require("../controllers/authentication");
const multer = require("multer");
const AWS = require("aws-sdk");
const uuid = require("uuid/v4");
const { postPinfromUser } = require("../controllers/pin_sp");
const s3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.AWS_AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});

const upload = multer({ storage }).single("photo");

router.post(
  "/signin",
  [
    check("phone_number", "number is required").isLength({ min: 9, max: 10 }),
    check("password", "password field is required").isLength({ min: 1 }),
  ],
  signin
);

router.post(
  "/createShipper",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  upload,
  (req, res) => {
    if (req.file) {
      let myFile = req.file.originalname.split(".");
      const fileType = myFile[myFile.length - 1];

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `users/${uuid()}.${fileType}`,
        Body: req.file.buffer,
      };
      s3.upload(params, (error, data) => {
        if (error) {
          res.status(500).send(error);
        }
        createShipper(data, req, res);
      });
    } else {
      createShipper("data", req, res);
    }
  }
);

router.post(
  "/signup",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  upload,
  (req, res) => {
    if (req.file) {
      let myFile = req.file.originalname.split(".");
      const fileType = myFile[myFile.length - 1];

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `users/${uuid()}.${fileType}`,
        Body: req.file.buffer,
      };
      s3.upload(params, (error, data) => {
        if (error) {
          res.status(500).send(error);
        }
        signup(data, req, res);
      });
    } else {
      signup("data", req, res);
    }
  }
);

router.get("/signout", signout);

router.get("/users", isSignedIn, isAuthenticated, getAllUsers);

router.get("/testroute", isSignedIn, (req, res) => {
  res.json(req.authentication);
});

module.exports = router;
