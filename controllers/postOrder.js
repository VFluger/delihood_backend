const { check, validationResult } = require("express-validator");

const sql = require("../db");

const stripe = require("stripe")(process.env.STRIPE_SECRET);

const PRICE_OF_DELIVERY = 30; // 30 Kc

// Create new order and send payment gate
/* Expected JSON:
    "items": [ {food_id: Int, quantity: Int, note: String} ]
    deliveryLocation: {
    "lat": Double
    "lng": Double
    }
    "tip": Int
*/
module.exports.newOrder = async (req, res) => {
  await check("items").isArray({ min: 1 }).run(req);
  await check("items.*.food_id").isInt().run(req);
  await check("items.*.quantity").isInt({ min: 1 }).run(req);
  await check("items.*.note").isString().trim().escape().run(req);
  await check("deliveryLocation.lat").isNumeric().run(req);
  await check("deliveryLocation.lng").isNumeric().run(req);
  await check("tip").isInt().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, deliveryLocation, tip } = req.body;

  // Cast into set to remove duplicates
  const itemIds = [...new Set(items.map((item) => item.food_id))];
  // Check if all foods exist
  const resultOfFood =
    await sql`SELECT * FROM foods WHERE id = ANY(${itemIds})`;
  if (resultOfFood.length !== items.length) {
    return res.status(404).send({ error: "Food doesn't exist" });
  }

  const cookIds = new Set(resultOfFood.map((food) => food.cook_id));
  if (cookIds.size !== 1) {
    return res
      .status(400)
      .send({ error: "All foods must be from the same cook" });
  }

  // Match foods to items and calculate prices
  const foodMap = new Map();
  for (const food of resultOfFood) {
    foodMap.set(food.id, food);
  }

  const arrOfPrices = [];
  for (const item of items) {
    const food = foodMap.get(item.food_id);
    if (!food) {
      return res
        .status(404)
        .send({ error: `Food with ID ${item.food_id} not found` });
    }
    arrOfPrices.push(food.price * item.quantity);
  }
  // Calculate total
  const totalPrice = arrOfPrices.reduce((a, b) => a + b, 0) + PRICE_OF_DELIVERY;
  // Push into db
  const resultOfNewOrder = await sql`INSERT INTO orders
            (price, 
            tip, 
            delivery_location_lng, 
            delivery_location_lat, 
            user_id)
            VALUES
            (${totalPrice}, ${tip}, ${deliveryLocation.lng}, ${deliveryLocation.lat}, ${req.session.user.id})
            RETURNING id`;

  const orderId = resultOfNewOrder[0].id;

  for (const item of items) {
    const itemPrice = foodMap.get(item.food_id).price;
    await sql`
    INSERT INTO order_items (order_id, food_id, quantity, notes, price_at_order)
    VALUES (${orderId}, ${item.food_id}, ${item.quantity}, ${item.note}, ${itemPrice})
  `;
  }
  // Send payment gate
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100, // Stripe uses minor units
      currency: "czk",
      metadata: {
        orderId: orderId.toString(),
        userId: req.session.user.id.toString(),
      },
      description: `Order #${orderId} by User ${req.session.user.id}`,
      receipt_email: req.session.user.email,
      //statement_descriptor: `DeliHood Order#${orderId}`,
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Cannot generate payment" });
  }
};

// Send payment for existing order (if something gone wrong from user)
module.exports.getPayment = async (req, res) => {
  check("id").isInt().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array() });
  }
  const orderId = req.query.id;

  const result =
    await sql`SELECT * FROM orders WHERE id=${orderId} AND status='pending'`;
  if (result.length < 1) {
    return res.status(404).send({ error: "Order not found" });
  }

  const orderFromDb = result[0];

  const existingIntents = await stripe.paymentIntents.search({
    query: `metadata['orderId']:'${orderId}'`,
  });
  console.log(existingIntents);
  if (existingIntents.data.length < 1) {
    // Generate a new paymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: orderFromDb.price * 100, // Stripe uses minor units
      currency: "czk",
      metadata: {
        orderId: orderId.toString(),
        userId: req.session.user.id.toString(),
      },
      description: `Order #${orderId} by User ${req.session.user.id}`,
      receipt_email: req.session.user.email,
      //statement_descriptor: `DeliHood Order#${orderId}`,
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
    return;
  }
  // return the existing paymentIntent
  res.send({
    cliendSecret: existingIntents.data[0].client_secret,
  });
};

module.exports.startOrder = async (req, res) => {
  await check("id").isInt().trim().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send({ error: errors.array() });
  }

  const orderId = req.query.id;
  // Check if order payed
  const resultOrder = await sql`SELECT * FROM orders WHERE id=${orderId}`;
  if (resultOrder.length < 1) {
    return res.status(404).send({ error: "Order not found" });
  }
  const intent = await stripe.paymentIntents.retrieve(
    resultOrder[0].payment_intent_id
  );
  if (intent.status !== "succeeded") {
    return res
      .status(400)
      .send({ error: "Payment not successfull", paymentStatus: intent.status });
  }
  // Update in db
  await sql`UPDATE orders SET status='accepted' WHERE id=${orderId}`;
  // Send info to cook
};
