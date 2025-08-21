const express = require("express");
const router = express.Router();

//Get info logic
const {
  getMe,
  getCooks,
  getFoodOfCook,
  getMyOrders,
  getOrderDetails,
} = require("../controllers/loadInfo");

router.get("/me", getMe);
router.get("/cooks", getCooks);
router.get("/cook/food", getFoodOfCook);
router.get("/me/orders", getMyOrders);
router.get("/me/order", getOrderDetails);

//Change Acc info logic
const { changeAcc } = require("../controllers/changeAcc");

router.post("/change/:changeParam", changeAcc);

//Order logic
const {
  updateOrder,
  getPayment,
  newOrder,
  cancelOrder,
} = require("../controllers/postOrder");

router.post("/new-order", newOrder);
router.get("/order/payment", getPayment);
router.get("/order/update", updateOrder);
router.post("/order/cancel", cancelOrder);

module.exports = router;
