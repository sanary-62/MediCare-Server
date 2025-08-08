# MediCare Server

This is the backend of the Medical Camp Management System (MCMS), built using Express.js and MongoDB. It provides secure APIs for user authentication, camp management, participant registration, payments, and feedback handling.

---

## 🔗 Live Server URL

🌐 [Live Server API](https://your-server-link.com)

---

## 🧰 Technologies Used

- Node.js
- Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT)
- dotenv
- Stripe
- CORS
- Morgan

---

## ⚙️ Core Features

- 🔐 JWT-based Authentication & Role Authorization
- 📁 Organizer API to Add, Update & Delete Camps
- 📝 Participant Registration & Cancellation
- 💳 Stripe Payment Integration
- 📋 Feedback & Ratings Submission
- 📈 API Support for Analytics and Chart Data
- 🔎 Search, Filter, and Pagination Support
- 🧾 Payment History & Transaction Logging
- 🛡️ Protected Routes for Organizer & Participant Dashboards

---

## 📦 Dependencies

"bash"
"express"
"cors"
"dotenv"
"jsonwebtoken"
"mongoose"
"stripe"
"morgan"

🧪 How to Run Locally
Clone the repo:

bash
git clone https://github.com/your-username/MediCare-Server.git
Install dependencies:

bash
npm install
Create a .env file in the root directory:

env
PORT=5000
MONGO_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
Start the server:

bash
npm run start
The server will run on: http://localhost:5000


📚 Related Links

[Client GitHub Repo](https://github.com/sanary-62/MediCare-Client)
[Live Client Site](https://medi-care-cd4fc.web.app/)



