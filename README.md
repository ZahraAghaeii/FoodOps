# 🍽️ FoodOps - Food Ordering & Kitchen Queue Management System

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?style=for-the-badge\&logo=nodedotjs)
![Express.js](https://img.shields.io/badge/Express.js-v4-000000?style=for-the-badge\&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%2FLocal-47A248?style=for-the-badge\&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**FoodOps** is a comprehensive, full-stack web application designed to automate food ordering, kitchen preparation queues, order delivery/pickup, and sales reporting for canteens, cafes, and small restaurants.

Built with a decoupled RESTful architecture, FoodOps manages the complete lifecycle of an order from initial customer browsing to final delivery.

---

## 📋 Table of Contents

* [✨ Key Features](#-key-features)
* [👥 User Roles & Access Control (RBAC)](#-user-roles--access-control-rbac)
* [🎨 UI/UX & Color Palette](#-uiux--color-palette)
* [📂 Architecture & Project Structure](#-architecture--project-structure)
* [🗄️ Database Schema (MongoDB)](#-database-schema-mongodb)
* [🔌 RESTful API Endpoints](#-restful-api-endpoints)
* [🛡️ Security & Business Logic](#-security--business-logic)
* [🚀 Installation & Setup Guide](#-installation--setup-guide)
* [🤝 Authors](#-authors)

---

## ✨ Key Features

* 🔑 **Authentication & Authorization:** Secure registration and login powered by JSON Web Tokens (JWT) and `bcryptjs` password hashing.
* 🔐 **Temporary Password Management:** Automatic random password generation for staff accounts created by the Admin, enforcing a mandatory password change upon their first login.
* 🎨 **Modern RTL User Interface:** Customized warm autumn/coffee color palette, right-hand side vertical navigation sidebar, and isolated page layouts.
* 🛒 **Dynamic Client-Side Cart:** Real-time price calculation, category filtering, keyword search, and item quantity increment/decrement controls.
* 📊 **Executive Sales Dashboard:** Real-time analytics displaying daily (24h), weekly (7d), and monthly (30d) revenue alongside order counts.
* 📋 **Kanban Order Board:** Visual status tracking across 5 color-coded columns: *Pending*, *Preparing*, *Ready*, *Delivered*, and *Cancelled*.
* 🛡️ **Server-Side Price Validation:** Total order prices are strictly calculated on the Backend to prevent client-side price manipulation.

---

## 👥 User Roles & Access Control (RBAC)

FoodOps enforces Role-Based Access Control (RBAC) across **4 primary user roles**:

| Role                   |  Icon | Responsibilities & Access Rights                                                                                                                                                                           |
| :--------------------- | :---: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Customer**           |   🛒  | Browse menu, filter by category/keyword, manage cart, place orders, track order status in real time, and view order history.                                                                               |
| **Kitchen Staff**      | 👨‍🍳 | View the kitchen queue ordered by timestamp, update order status to "In Preparation" and "Ready for Pickup".                                                                                               |
| **Cashier / Delivery** |   🚀  | View orders ready for delivery/pickup, match order ID with customers, and mark orders as "Delivered".                                                                                                      |
| **Admin**              |   👤  | Full system oversight: Manage menu items and categories, register staff with auto-generated passwords, manage user roles, delete accounts, view the overall Kanban order board, and monitor sales reports. |

---

## 🎨 UI/UX & Color Palette

The user interface uses CSS custom properties (`var`) for a cohesive theme inspired by warm coffee and autumn aesthetics:

* **Right-Hand Sidebar:** Warm mahogany/brick brown (`#4a210d`) with a subtle gradient and clean white text with orange hover highlights.
* **Main Background:** Soft warm cream (`#faf5ef`).
* **Primary Buttons & Accents:** Vibrant autumn orange (`#d97706`) and hover states (`#b45309`).
* **Authentication Pages (Login/Register):** Split-card layout featuring the `loginPage.png` cover image on the right and the form section on the left.

---

## 📂 Architecture & Project Structure

FoodOps is structured as a clean, decoupled application with a Node.js/Express REST API on the Backend and a Vanilla HTML5/CSS3/JavaScript Frontend:

```text
FoodOps/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── seed.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── categoryController.js
│   │   ├── menuController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Category.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── menuRoutes.js
│   │   └── orderRoutes.js
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── css/
    │   └── style.css
    ├── images/
    │   ├── loginPage.png
    │   └── pic.png
    ├── js/
    │   ├── app.js
    │   ├── auth.js
    │   ├── navbar.js
    │   ├── profile.js
    │   ├── cart.js
    │   ├── kitchen.js
    │   ├── delivery.js
    │   ├── orders.js
    │   └── admin-orders.js
    ├── index.html
    ├── login.html
    ├── register.html
    ├── change-password.html
    ├── admin-manage-menu.html
    ├── admin-reports.html
    ├── admin-orders.html
    ├── cart.html
    ├── kitchen.html
    ├── delivery.html
    ├── orders.html
    └── profile.html
```

---

## 🗄️ Database Schema (MongoDB)

### 1. User Schema (`User.js`)

* `name`: Full name (String, Required)
* `email`: Unique email address (String, Required, Unique)
* `password`: Hashed password (String, Required)
* `phone`: Contact number (String)
* `role`: User role (`Customer`, `Kitchen Staff`, `Cashier`, `Admin`)
* `isPasswordTemp`: Flag for enforcing password change on first login (Boolean, Default: `false`)

### 2. MenuItem Schema (`MenuItem.js`)

* `name`: Item name (String, Required)
* `description`: Item description (String)
* `price`: Unit price in Tomans (Number, Required)
* `stock`: Available stock quantity (Number, Default: `10`)
* `imageUrl`: Image path/URL (String)
* `category`: Reference to `Category` Object ID
* `isAvailable`: Item availability status (Boolean, Default: `true`)

### 3. Order Schema (`Order.js`)

* `customer`: Reference to `User` Object ID
* `items`: Array of items containing `menuItem` ID, `quantity`, and `price`
* `totalPrice`: Server-calculated total price (Number)
* `status`: Order lifecycle status (`Pending`, `Preparing`, `Ready`, `Delivered`, `Cancelled`)

---

## 🔌 RESTful API Endpoints

### 🔑 Authentication & Users (`/api/auth`)

|  Method  | Endpoint           | Description                                                          |
| :------: | :----------------- | :------------------------------------------------------------------- |
|  `POST`  | `/register`        | Public customer registration                                         |
|  `POST`  | `/login`           | User authentication & JWT issuance                                   |
|   `GET`  | `/me`              | Get current user profile *(Auth required)*                           |
|   `PUT`  | `/profile`         | Update user profile *(Auth required)*                                |
|  `POST`  | `/change-password` | Change temporary password to permanent *(Auth required)*             |
|   `GET`  | `/users`           | Retrieve all registered users *(Admin only)*                         |
|  `PATCH` | `/users/:id/role`  | Update user role *(Admin only)*                                      |
|  `POST`  | `/staff`           | Register staff with an auto-generated random password *(Admin only)* |
| `DELETE` | `/users/:id`       | Delete user account *(Admin only, self-deletion protected)*          |

### 📁 Categories (`/api/categories`)

| Method | Endpoint | Description                          |
| :----: | :------- | :----------------------------------- |
|  `GET` | `/`      | Get all categories                   |
| `POST` | `/`      | Create a new category *(Admin only)* |

### 🍕 Menu Items (`/api/menu`)

|  Method  | Endpoint            | Description                                       |
| :------: | :------------------ | :------------------------------------------------ |
|   `GET`  | `/`                 | Fetch all menu items                              |
|  `POST`  | `/`                 | Add a new menu item *(Admin only)*                |
|  `PATCH` | `/:id/price`        | Update item price *(Admin only)*                  |
|  `PATCH` | `/:id/stock`        | Update item stock *(Admin only)*                  |
|  `PATCH` | `/:id/availability` | Toggle item active/inactive status *(Admin only)* |
| `DELETE` | `/:id`              | Delete menu item *(Admin only)*                   |

### 📦 Orders & Operations (`/api/orders`)

|  Method | Endpoint      | Description                                                     |
| :-----: | :------------ | :-------------------------------------------------------------- |
|  `POST` | `/cart/add`   | Add item to cart                                                |
|  `GET`  | `/cart`       | Fetch current user's active cart                                |
|  `POST` | `/checkout`   | Finalize cart and place order                                   |
|  `GET`  | `/my-orders`  | Fetch customer's order history                                  |
|  `GET`  | `/all`        | Fetch all system orders for the Kanban board *(Admin only)*     |
|  `GET`  | `/kitchen`    | Fetch active kitchen queue *(Kitchen Staff & Admin)*            |
|  `GET`  | `/delivery`   | Fetch orders ready for pickup/delivery *(Cashier & Admin)*      |
| `PATCH` | `/:id/status` | Update order status                                             |
|  `GET`  | `/reports`    | Fetch daily, weekly, and monthly sales analytics *(Admin only)* |

---

## 🛡️ Security & Business Logic

### 1. Server-Side Price Validation

The total price of an order is strictly calculated on the Backend by fetching item prices directly from the database, ignoring any price payloads sent from the client.

### 2. Stock Inventory Control

Item stock is verified upon checkout. Once confirmed, stock counts are automatically decremented to prevent over-ordering.

### 3. Temporary Password Route Guard

Staff accounts created by the Admin receive a temporary random password and are flagged with `isPasswordTemp: true`.

Frontend route guards redirect these users directly to `change-password.html` upon login, restricting access to all other pages until the password is changed.

### 4. Data Protection & Hashing

User passwords are never stored in plain text and are salted and hashed using `bcryptjs`.

---

## 🚀 Installation & Setup Guide

### Prerequisites

* [Node.js](https://nodejs.org/) — v18.x or higher
* [MongoDB](https://www.mongodb.com/) — Local instance or MongoDB Atlas connection URI

### 1. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Install the project dependencies:

```bash
npm install
```

Optionally, seed the database with initial categories, menu items, and an admin user:

```bash
node config/seed.js
```

Start the Express server:

```bash
npm start
```

The server will run on:

```text
http://localhost:5000
```

### 2. Frontend Setup

The frontend consists of static assets and does not require a build step.

You can serve it using **Live Server** in VS Code or any other static HTTP server.

Open:

```text
frontend/index.html
```

using Live Server.

The frontend will typically be available at:

```text
http://127.0.0.1:5500
```

or:

```text
http://localhost:5500
```

---

## 🤝 Authors

This project was developed by:

- **AriaTn84**
- **ZahraAghaeii**

Developed for the **Internet Engineering** course at **K. N. Toosi University of Technology**.
