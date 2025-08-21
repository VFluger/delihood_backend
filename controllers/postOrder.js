const { check, validationResult } = require("express-validator");

const sql = require("../db");

const stripe = require("stripe")(process.env.STRIPE_SECRET);

const PRICE_OF_DELIVERY = 30; // 30 Kc

// Create new order and send payment gate
module.exports.newOrder = async (req, res) => {
  console.log("Ordering...");
  await check("items").isArray({ min: 1 }).run(req);
  await check("items.*.food.id").isInt().run(req);
  await check("items.*.quantity").isInt({ min: 1 }).run(req);
  await check("items.*.note").isString().trim().escape().run(req);
  await check("deliveryLocationLat").isNumeric().run(req);
  await check("deliveryLocationLng").isNumeric().run(req);
  await check("tip").isInt().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, deliveryLocationLat, deliveryLocationLng, tip } = req.body;

  // Cast into set to remove duplicates
  const itemIds = [...new Set(items.map((item) => item.food.id))];
  // Check if all foods exist
  const resultOfFood = await sql`SELECT *
     FROM foods
      WHERE id = ANY(${itemIds})
      AND cook_id IN (SELECT id FROM cooks WHERE is_online = true)`;
  console.log(resultOfFood);
  if (resultOfFood.length !== items.length) {
    console.log("food doesnt exist");
    return res
      .status(404)
      .send({ error: "Food doesn't exist or cook is offline" });
  }

  const cookIds = new Set(resultOfFood.map((food) => food.cook_id));
  if (cookIds.size !== 1) {
    console.log("All food from the same cook");
    return res
      .status(400)
      .send({ error: "All foods must be from the same cook" });
  }

  // Check if there is a driver within 25km who is online
  const driverResult = await sql`
    SELECT id FROM drivers
    WHERE is_online = true
    AND ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint(${deliveryLocationLng}, ${deliveryLocationLat}), 4326)::geography,
      25000
    )
    LIMIT 1
  `;

  if (driverResult.length < 1) {
    console.log("No drivers");
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
    const food = foodMap.get(item.food.id);
    if (!food) {
      console.log("Food not found");
      return res
        .status(404)
        .send({ error: `Food with ID ${item.food.id} not found` });
    }
    arrOfPrices.push(food.price * item.quantity);
  }
  // Calculate total
  const totalPrice = arrOfPrices.reduce((a, b) => a + b, 0) + PRICE_OF_DELIVERY;
  //Create paymentIntent in Stripe

  // Push into db with PostGIS geography point for delivery_location
  const resultOfNewOrder = await sql`INSERT INTO orders
            (price, 
            tip, 
            delivery_location, 
            user_id)
            VALUES
            (${totalPrice}, ${tip}, ST_SetSRID(ST_MakePoint(${deliveryLocationLng}, ${deliveryLocationLat}), 4326)::geography, ${req.user.id})
            RETURNING id`;

  const orderId = resultOfNewOrder[0].id;

  for (const item of items) {
    const itemPrice = foodMap.get(item.food.id).price;
    await sql`
    INSERT INTO order_items (order_id, food_id, quantity, notes, price_at_order)
    VALUES (${orderId}, ${item.food.id}, ${item.quantity}, ${item.note}, ${itemPrice})
  `;
  }
  // Send paymentIntent
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100, // Stripe uses minor units
      currency: "czk",
      payment_method_types: ["card"], // only accept card in this demo
      metadata: {
        orderId: orderId,
        userId: req.user.id.toString(),
      },
      description: `Order#${orderId} by User ${req.user.id}`,
      receipt_email: req.user.email,
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
      orderId,
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
    console.log("New payment");
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
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
      orderId: orderId,
    });
    return;
  }
  // return the existing paymentIntent
  console.log(existingIntents.data[0].client_secret);
  res.send({
    clientSecret: existingIntents.data[0].client_secret,
    orderId: result[0].id,
  });
};

module.exports.updateOrder = async (req, res) => {
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
  const intent = await stripe.paymentIntents.search({});

  if (intent.status !== "succeeded") {
    //not paid
    return res.send({ status: "pending", paymentStatus: intent.status });
  }
  switch (resultOrder[0].status) {
    case "pending" || "paid":
      //Order paid but not started
      // Update in db
      await sql`UPDATE orders SET status='paid' WHERE id=${orderId}`;
      //MAIN LOGIC
      // Send info to cook
      res.send({ orderId, status: "paid" });
      break;
    default:
      //If anything else, just send the status
      res.send({ orderId, status: resultOrder[0].status });
      break;
  }
};
