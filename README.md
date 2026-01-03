# 🛒 ShopEasy

A high-performance MERN-stack e-commerce platform designed for seamless merchant onboarding and a secure, responsive shopping experience.  
Built with a focus on real-time updates, secure payments, and cloud-based asset management.

📖 **Table of Contents**
- [About The Project](#about-the-project)
- [✨ Features](#features)
- [🛠️ Built With](#built-with)
- [🚀 Getting Started](#getting-started)
- [⚙️ Configuration](#configuration)
- [💻 Usage](#usage)
- [🤝 Our Team](#our-team)
- [📷 Screenshots](#screenshots)

---

## About The Project

**ShopEasy** addresses the complexities of modern digital commerce by providing small-scale sellers with enterprise-grade tools. It features a streamlined "Seller Onboarding" wizard, real-time inventory tracking, and a robust customer storefront. The platform is engineered to be fully responsive, ensuring a premium experience on both mobile and desktop devices.



---

## ✨ Features

* **Seller Onboarding:** Multi-step verification for Business details and Bank setup.
* **Real-time Engine:** Instant order notifications and stock alerts via **Socket.io** and **Redis**.
* **Secure Payments:** Full **Razorpay** integration with server-side signature validation.
* **Communications:** Automated Email (Brevo/Nodemailer) and SMS (Twilio) notifications for OTPs and order updates.
* **Cloud Asset Management:** Automated image optimization and hosting via **Cloudinary**.
* **Responsive Analytics:** Mobile-first dashboard for merchants to track wellness trends and sales.

---

## 🛠️ Built With

### Backend & Infrastructure
* **Node.js & Express.js**: Core server-side architecture.
* **MongoDB & Mongoose**: NoSQL database for flexible data modeling.
* **Redis**: Used for high-speed data caching and message brokering.
* **Socket.io**: Real-time bidirectional communication.

### Frontend
* **React.js**: Component-based UI for a fluid Single Page Application.
* **Tailwind CSS**: Utility-first styling for complete responsiveness.
* **Context API**: Native React state management for auth and cart logic.
* **Lucide React**: Premium iconography for an intuitive user interface.

---

## 🚀 Getting Started

Follow these steps to set up the project locally:

### 1. Clone the Repository
```bash
git clone https://github.com/[Your-Username]/ShopEasy.git
cd ShopEasy
````


### 2. Install Backend Dependencies
Navigate to the server directory and install the necessary Node.js packages:
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
Navigate to the frontend directory and install the required React packages:
```bash
cd ../frontend
npm install
```

### 4. Run the Application
To see the project in action, you need to start both the backend and frontend servers. Open two separate terminals:

**Terminal 1: Start the Backend Server**
```bash
cd backend
npm run start
npm run dev
```

**Terminal 1: Start the Frontend Server**
```bash
cd frontend
npm run dev
```

---

## ⚙️ Configuration

To run this project, you must set up your environment variables. Create a file named `.env` in the **backend** directory and paste the following content:

```env
# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_random_jwt_secret_string
GOOGLE_CLIENT_ID=your_google_client_id

# Email Service (Brevo/Nodemailer)
BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_email_address
EMAIL_PASS=your_app_specific_password
FROM_EMAIL=your_verified_sender_email
FROM_NAME=ShopEasy

# SMS Service (Twilio)
TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cloud Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Redis Configuration
REDIS_HOST=your_redis_endpoint
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
```
