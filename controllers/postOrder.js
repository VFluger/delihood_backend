const { check, validationResult } = require("express-validator");

const sql = require("../db");

const stripe = require("stripe")(process.env.STRIPE_SECRET);

const PRICE_OF_DELIVERY = 30; // 30 Kc

// Create new order and send payment gate
/* Expected JSON:
    "items": [ {foodId: Int, quantity: Int, note: String} ]
    deliveryLocation: {
    "lat": Double
    "lng": Double
    }
    "tip": Int
*/
module.exports.newOrder = async (req, res) => {
  await check("items").isArray({ min: 1 }).run(req);
  await check("items.*.foodId").isInt().run(req);
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
  const itemIds = [...new Set(items.map((item) => item.foodId))];
  // Check if all foods exist
  const resultOfFood = await sql`SELECT *
     FROM foods
      WHERE id = ANY(${itemIds})
      AND cook_id IN (SELECT id FROM cooks WHERE online = true)`;
  if (resultOfFood.length !== items.length) {
    return res
      .status(404)
      .send({ error: "Food doesn't exist or cook is offline" });
  }

  const cookIds = new Set(resultOfFood.map((food) => food.cook_id));
  if (cookIds.size !== 1) {
    return res
      .status(400)
      .send({ error: "All foods must be from the same cook" });
  }

  // Check if there is a driver within 25km who is online
  const driverResult = await sql`
    SELECT id FROM drivers
    WHERE online = true
    AND ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint(${deliveryLocation.lng}, ${deliveryLocation.lat}), 4326)::geography,
      25000
    )
    LIMIT 1
  `;

  if (driverResult.length < 1) {
    return res
      .status(400)
      .send({ error: "No driver available in your location" });
  }

  // Match foods to items and calculate prices
  const foodMap = new Map();
  for (const food of resultOfFood) {
    foodMap.set(food.id, food);
  }

  const arrOfPrices = [];
  for (const item of items) {
    const food = foodMap.get(item.foodId);
    if (!food) {
      return res
        .status(404)
        .send({ error: `Food with ID ${item.foodId} not found` });
    }
    arrOfPrices.push(food.price * item.quantity);
  }
  // Calculate total
  const totalPrice = arrOfPrices.reduce((a, b) => a + b, 0) + PRICE_OF_DELIVERY;

  // Push into db with PostGIS geography point for delivery_location
  const resultOfNewOrder = await sql`INSERT INTO orders
            (price, 
            tip, 
            delivery_location, 
            user_id)
            VALUES
            (${totalPrice}, ${tip}, ST_SetSRID(ST_MakePoint(${deliveryLocation.lng}, ${deliveryLocation.lat}), 4326)::geography, ${req.user.id})
            RETURNING id`;

  const orderId = resultOfNewOrder[0].id;

  for (const item of items) {
    const itemPrice = foodMap.get(item.foodId).price;
    await sql`
    INSERT INTO order_items (order_id, foodId, quantity, notes, price_at_order)
    VALUES (${orderId}, ${item.foodId}, ${item.quantity}, ${item.note}, ${itemPrice})
  `;
  }
  // Send payment gate
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100, // Stripe uses minor units
      currency: "czk",
      metadata: {
        orderId: orderId.toString(),
        userId: req.user.id.toString(),
      },
      description: `Order #${orderId} by User ${req.user.id}`,
      receipt_email: req.user.email,
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
        userId: req.user.id.toString(),
      },
      description: `Order #${orderId} by User ${req.user.id}`,
      receipt_email: req.user.email,
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
  await sql`UPDATE orders SET status='paid' WHERE id=${orderId}`;
  // Send info to cook
};
