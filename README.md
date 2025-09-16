# Delihood Backend

This repository contains the **backend** for my SOČ project — _Delihood_, a fictional food-ordering service.  
The idea behind Delihood comes from combining **deli (delivery)** and **hood (neighborhood)**: ordering meals prepared by everyday people living nearby.

---

## 📖 About the Project

Delihood is not a real service but a **conceptual prototype** developed for my SOČ (Student Professional Activity) work in Czechia.  
It consists of two main parts:

- **Backend (this repository)**: Node.js, Express, PostgreSQL, JWT authentication, and integrations.
- **iOS App (SwiftUI frontend)**: SwiftUI, MVVM, UIKit, WidgetKit etc.

The goal is to demonstrate how such a platform could be structured from both technical and UX perspectives.

---

## ⚙️ Features (Backend)

- **Authentication & Security**

  - Register and login with the option for **Google OpenID**
  - Email verification flow
  - Password reset ("forgotten password")
  - JWT-based session handling

- **Database**

  - PostgreSQL for persistent storage
  - Fetching user info, cooks, drivers, and orders

- **Orders & Payments**

  - Create and manage new orders
  - Stripe **PaymentIntent** integration

- **Communication Logic**
  - Base structure for contacting cooks and drivers
  - APNs (Apple Push Notifications) outlined, but not implemented

---

## 🛠️ Tech Stack

- **Node.js** with **Express**
- **PostgreSQL**
- **JWT** for authentication
- **Stripe** for payments
- **Google OpenID** for login

---

## 📲 Related Repositories

- [📘 SOČ Work (Documentation PDF)](TODO-LINK-FOR-PDF)
- [📱 Delihood iOS App (SwiftUI frontend)](https://github.com/VFluger/delihood_ios.git)

---

## 🚀 Running the Project

1. Clone the repo:
   ```bash
   git clone https://github.com/VFluger/delihood_backend.git
   cd deliehood_backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```
   DATABASE_URL=...
   JWT_SECRET=...
   STRIPE_SECRET_KEY=...
   GOOGLE_CLIENT_ID=...
   ```
4. Run the server:
   ```bash
   npm start
   ```

---

## 📌 Notes

- This project is **fictional** and not intended for real-world deployment.
- Licensed under the **MIT License**.

---
