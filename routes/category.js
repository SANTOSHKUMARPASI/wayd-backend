var express = require("express");
var router = express.Router();

const {
  getcategoryById,
  createCategory,
  getAllCategory,
  getCategory,
  updateCategory,
  removeCategory,
  deleteCategory,
} = require("../controllers/category");
const {
  isSignedIn,
  isAuthenticated,
  isAdmin,
} = require("../controllers/authentication");
const { getUserById } = require("../controllers/user");
// const category = require("../models/category");

router.param("userId", getUserById);
router.param("categoryId", getcategoryById);
//create

router.post("/category/create",isSignedIn,isAuthenticated, isAdmin, createCategory);
// router.post("/category/create", createCategory);
//read
router.get("/category/:categoryId", getCategory);
router.get("/categories", getAllCategory);

//update
router.put(
  "/category/:categoryId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updateCategory
);

//delete

router.delete(
  "/category/:categoryId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteCategory
);

module.exports = router;
