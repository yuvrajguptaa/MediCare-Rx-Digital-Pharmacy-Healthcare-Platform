# 🏥 MediCare — Online Pharmacy & Healthcare Platform (MVP)

A **realistic, fully functional, and interview-ready Online Pharmacy Web Application** built with **React**, **Django REST Framework (DRF)**, and **MongoDB**.

---

## 🌟 Key Architecture & Stack

* **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Canvas-Confetti, Axios
* **Backend**: Django 6.1, Django REST Framework (DRF), Django CORS Headers
* **Database**: MongoDB (v8.2) with PyMongo & custom BSON object serializers
* **Authentication**: JWT (JSON Web Tokens) with auto-refresh and role-based permissions (`USER`, `ADMIN`, `PHARMACIST`)

---

## 🚀 1-Click Demo Login Credentials

The database comes pre-seeded with realistic healthcare medicines, categories, prescriptions, orders, reviews, and test accounts:

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| 🧑‍💼 **Customer (User)** | `user@medicare.com` | `Password123!` | Catalog, Cart, Rx Upload, Checkout, Orders Tracking, Reviews |
| 💊 **Pharmacist** | `pharmacist@medicare.com` | `Password123!` | Prescriptions Verification, Order Fulfillment, Stock Management |
| 🛡️ **Administrator** | `admin@medicare.com` | `Password123!` | Full Admin Analytics, User Management, Coupons, Category CRUD |
Demo Accounts for Testing
Role	Email	Password	Landing Page
Customer	user@medicare.com	Password123!	/orders
Admin / Pharmacist	admin@medicare.com	Password123!	/admin/orders
Delivery Rider 1	delivery@medicare.com	Password123!	/delivery
Delivery Rider 2	delivery2@medicare.com	Password123!	/delivery

*(Note: The login page includes quick 1-click buttons to instantly fill and sign in with any role!)*

---

## 📦 Implemented MVP Features & Workflows

### 1. Authentication & Security
- Register, Login, Refresh Token, Profile edit, Change Password, Forgot/Reset Password (with OTP simulation).
- Secure password hashing using `bcrypt` and JWT authentication.
- Strict role-based authorization for customers, licensed pharmacists, and administrators.

### 2. Medicine Catalog, Search & Filtering
- **50 Realistic Medicines** across **10 Categories** (Antibiotics, Pain Relief, Cardiovascular, Diabetes, Dermatology, Vitamins, Respiratory, Gastrointestinal, Mental Health, Eye & Ear Care).
- Debounced live search autocomplete suggestions popup.
- Multi-dimensional server-side filtering: Category, Brand, Price Range (Min/Max), Prescription requirement (`OTC` vs `Rx Required`), In-Stock only.
- Sorting by Price (Low $\leftrightarrow$ High), Rating, Discount, Name (A $\to$ Z), Newest.

### 3. Prescription Upload & Pharmacist Review Workflow
- Secure file upload supporting JPG, PNG, and PDF (up to 10MB).
- Prescription statuses: `PENDING`, `APPROVED`, `REJECTED`.
- Pharmacist / Admin review queue with inline file viewer, approve/reject buttons, and custom review feedback notes.
- Automatic in-app notification trigger when prescription status changes.

### 4. Cart, Pricing Engine & Coupon Validation
- **100% Server-Side Price Calculations**: MRP subtotal, selling subtotal, MRP discount savings, coupon deductions, delivery fee (Free over ₹500, else ₹40), and final payable total.
- Active stock validation with quantity increment/decrement controls.
- Active coupon validation engine (`HEALTH10`, `PHARMA20`, `FIRSTMED50`, `SAVE15`, `FLAT100`).
- Automated prescription-required item detection and checkout gating.

### 5. 3-Step Checkout & Simulated Payments
- **Step 1: Delivery Address** (Select saved address or add new with modal).
- **Step 2: Order Summary & Prescription** (Cart review + attach approved Rx).
- **Step 3: Payment Selection** (Razorpay / Instant Card Test Mode / Cash on Delivery).
- Decrements live inventory stock and clears active cart upon order placement.
- Confetti celebration upon successful placement!

### 6. Orders & Simulated Logistics Tracking
- Visual timeline stepper: `PLACED` $\to$ `CONFIRMED` $\to$ `PACKED` $\to$ `SHIPPED` $\to$ `OUT_FOR_DELIVERY` $\to$ `DELIVERED`.
- Detailed activity log with timestamps and logistics notes.
- Order cancellation (allowed in PLACED/CONFIRMED status, automatically restores stock).
- One-click **Reorder** function.
- Printable / downloadable tax invoice.

### 7. Verified Reviews System
- 1–5 star rating, headline, and detailed comment.
- **Verified Purchase Enforcement**: Only customers who actually purchased and received the medicine can post a review.
- Dynamic recalculation of average ratings and total review counts on medicine documents.

### 8. MediAI Health Assistant
- Intelligent pharmaceutical information assistant.
- Explains active ingredients, common uses, precautions, and OTC remedies.
- Clearly states statutory **Medical Disclaimer** that it is an AI assistant, not a doctor.
- Direct links to catalog medicines mentioned in user queries.

### 9. Admin & Pharmacist Management Portal
- **Dashboard Analytics**: Total Revenue, Total Orders, Total Medicines, Total Users, Low Stock Alerts, Recharts monthly revenue and order volume area/bar charts.
- **Medicine CRUD**: Add/Edit medicines, upload image links, update stock, toggle prescription requirement.
- **Order Logistics**: Advance order status timeline and push customer notifications.
- **Prescription Queue**: Pharmacist approval/rejection modal with notes.
- **Inventory Overview**: Monitor low-stock items ($\le 15$ units) and batch stock updates.
- **Promotional Coupons**: Create discount percentages, minimum order caps, and toggle active status.
- **User Management**: View user accounts, toggle active/deactivated, and switch role permissions.

---

## 🛠️ How to Run Locally

### Prerequisites
1. Python 3.10+
2. Node.js v18+
3. MongoDB running on `mongodb://localhost:27017/`

### 1. Backend Setup (Django REST Framework)
```bash
cd backend
pip install -r requirements.txt # or: pip install pymongo djangorestframework django-cors-headers pyjwt bcrypt requests python-dotenv

# Seed MongoDB with 50 medicines, 10 categories, demo users, orders & coupons
python seed_data.py

# Start Django development server (runs on http://127.0.0.1:8000)
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
# App will be accessible at http://127.0.0.1:5173
```

### 3. Run Automated End-to-End Test Suite
```bash
cd backend
python test_e2e_workflow.py
```

---

## 📜 API Endpoints Overview

* **Auth**: `/api/v1/auth/register/`, `/api/v1/auth/login/`, `/api/v1/auth/refresh/`, `/api/v1/auth/profile/`, `/api/v1/auth/change-password/`
* **Medicines**: `/api/v1/medicines/`, `/api/v1/medicines/<id>/`, `/api/v1/medicines/suggestions/`, `/api/v1/medicines/featured/`
* **Categories**: `/api/v1/categories/`, `/api/v1/categories/<slug>/`
* **Cart & Wishlist**: `/api/v1/cart/`, `/api/v1/wishlist/`, `/api/v1/wishlist/move-to-cart/`
* **Prescriptions**: `/api/v1/prescriptions/upload/`, `/api/v1/prescriptions/my/`, `/api/v1/prescriptions/review/list/`
* **Orders**: `/api/v1/orders/`, `/api/v1/orders/my/`, `/api/v1/orders/<id>/`, `/api/v1/orders/<id>/cancel/`, `/api/v1/orders/<id>/reorder/`
* **Addresses**: `/api/v1/addresses/`, `/api/v1/addresses/<id>/`
* **Coupons**: `/api/v1/coupons/validate/`, `/api/v1/admin/coupons/`
* **Reviews**: `/api/v1/reviews/medicine/<id>/`, `/api/v1/reviews/can-review/<id>/`
* **Notifications**: `/api/v1/notifications/`, `/api/v1/notifications/<id>/read/`
* **MediAI**: `/api/v1/ai/chat/`
* **Admin Portal**: `/api/v1/admin/stats/`, `/api/v1/admin/users/`, `/api/v1/admin/medicines/`, `/api/v1/admin/inventory/`
