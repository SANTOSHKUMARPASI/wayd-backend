var express = require("express");
const {
  isSignedIn,
  isAuthenticated,
  isAdmin,
} = require("../controllers/authentication");
const {
  updatePincode,
  getpinById,
  getPincodes,
  createPincode,
} = require("../controllers/pin_sp");
var router = express.Router();

router.param("pinId", getpinById);
// router.post(
//     "/pin",
//     isSignedIn,
//     isAuthenticated,
//     isAdmin,

//   );
router.patch(
  "/pin/:pinId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  updatePincode
);
router.get("/pin", isSignedIn, isAuthenticated, isAdmin, getPincodes);

router.post("/pin/create", isSignedIn, isAuthenticated, isAdmin, createPincode);

module.exports = router;
