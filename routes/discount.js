const express = require("express");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/authentication");
const { createDiscount, getAllDiscounts } = require("../controllers/discount");
const { getUserById } = require("../controllers/user");
const router = express.Router();

router.param("userId", getUserById);
router.post(
    "/discount",
    isSignedIn,
    isAuthenticated,
    isAdmin,
    createDiscount
  );
  router.get("/discount",isSignedIn,isAuthenticated,getAllDiscounts)

  module.exports = router;