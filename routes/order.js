var express = require("express");
var router = express.Router();
const {
  isSignedIn,
  isAuthenticated,
  isAdmin,
} = require("../controllers/authentication");
const {
  pushOrderInPurchaseList,
  getUserById,
  checkorderStock,
} = require("../controllers/user");
const { updateStock } = require("../controllers/product");

const {
  getOrderById,
  createOrder,
  getAllOrders,
  getOrderStatus,
  updateStatus,
  getOrder,
  deleteOrder,
  // CashCollected,
  CouponVerification,
  ProcurementList,
  checkStatusValidation,
  GetProcurementList,
  updatePrice,
  discountverify,
  userOrdersHistory,
  getDeliveryOrders,
  updateDeliveyOrder,
  assigndelivey,
  // finalDeliveryStatus,
  deliverySucess,
  // Order lifecycle
  getOrderLifecycle,
  getDeliveryorderByUserId,
} = require("../controllers/order");

//params
router.param("userId", getUserById);
router.param("orderId", getOrderById);
router.param("procure", getOrderById);

router.post(
  "/order/create",
  isSignedIn,
  isAuthenticated,
  // discountverify,
  createOrder
);

router.get(
  "/user/userOrdersHistory/:userID",
  isSignedIn,
  isAuthenticated,
  userOrdersHistory
);

router.get(
  "/order/:orderId/single",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getOrder
);
router.get("/order/all", isSignedIn, isAuthenticated, isAdmin, getAllOrders);
router.get(
  "/order/status/:orderId",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getOrderStatus
);
router.put(
  "/order/:orderId/status",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  checkorderStock,
  checkStatusValidation,
  CouponVerification,
  pushOrderInPurchaseList,
  // updateStock,
  updatePrice,
  updateStatus
);

router.delete(
  "/order/:orderId/delete",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  deleteOrder
);
router.put("/order/procure/:id", ProcurementList);
router.get("/order/procure", GetProcurementList);
module.exports = router;

// get order delivey order
router.get("/delivery/:status", isSignedIn, isAuthenticated, getDeliveryOrders);

//assign delivey Boy
router.put(
  "/assigndelivery/:orderid",
  isSignedIn,
  isAuthenticated,
  assigndelivey
);

// deliver to vender

// router.put(
//   "/order/:orderid/delivery",
//   isSignedIn,
//   isAuthenticated,
//   finalDeliveryStatus
// );

router.put("/deivery/updatestatus/:orderid", deliverySucess);

//Get order lifecycle
router.get(
  "/lifecycle/:id",
  isSignedIn,
  isAuthenticated,
  isAdmin,
  getOrderLifecycle
);

//getdeliveryordersbyuserid

router.get("/orders/delivery/:userid", getDeliveryorderByUserId);

module.exports = router;
