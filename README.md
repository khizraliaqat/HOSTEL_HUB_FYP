# HostelHub - A web Based Hostel Management System.

A modernized hostel management system built with Node.js, Express, and MongoDB following MVC architecture.

## 🎯 What's New in This Refactored Version

### Architecture Improvements
- ✅ **MVC Pattern**: Clean separation of concerns with Models, Views, and Controllers
- ✅ **MongoDB with Mongoose**: Replaced MySQL with MongoDB for better scalability
- ✅ **Modular Routes**: Organized routes into separate files for maintainability
- ✅ **Middleware Architecture**: Reusable authentication and upload middleware
- ✅ **Error Handling**: Centralized error handling middleware
- ✅ **Environment Variables**: Configuration through `.env` file

### Project Structure
```
HostelHubNode-main/
├── config/
│   └── database.js          # MongoDB connection configuration
├── models/                  # Mongoose schemas
│   ├── User.js
│   ├── Hostel.js
│   ├── Room.js
│   ├── Booking.js
│   ├── Review.js
│   ├── Wishlist.js
│   ├── Complaint.js
│   ├── RentPayment.js
│   ├── Message.js
│   ├── MessMenu.js
│   ├── CommunityMessage.js
│   ├── PaymentSettings.js
│   └── ContactMessage.js
├── controllers/             # Business logic
│   ├── authController.js
│   ├── hostelController.js
│   ├── bookingController.js
│   ├── studentController.js
│   ├── ownerController.js
│   ├── roomController.js
│   ├── profileController.js
│   ├── chatController.js
│   ├── communityController.js
│   └── pageController.js
├── routes/                  # Route definitions
│   ├── authRoutes.js
│   ├── hostelRoutes.js
│   ├── bookingRoutes.js
│   ├── studentRoutes.js
│   ├── ownerRoutes.js
│   ├── roomRoutes.js
│   ├── profileRoutes.js
│   ├── chatRoutes.js
│   ├── communityRoutes.js
│   └── pageRoutes.js
├── middleware/              # Custom middleware
│   ├── auth.js             # Authentication middleware
│   ├── upload.js           # File upload configuration
│   ├── locals.js           # View locals middleware
│   └── errorHandler.js     # Error handling
├── views/                   # EJS templates (unchanged)
├── public/                  # Static assets
│   ├── css/
│   └── uploads/
├── .env                     # Environment variables
├── app.js                   # Application entry point (refactored)
└── package.json             # Dependencies

```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Install MongoDB** (if not already installed)
   - Windows: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas (cloud): [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Clone and Install Dependencies**
   ```bash
   cd HostelHubNode-main
   npm install
   ```

3. **Configure Environment Variables**
   - Edit the `.env` file with your settings:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/hostelhub_db
   SESSION_SECRET=your_secret_key_here
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   # Windows
   net start MongoDB

   # Or start mongod manually
   mongod --dbpath "C:\data\db"
   ```

5. **Run the Application**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

6. **Access the Application**
   - Open your browser and navigate to: `http://localhost:3000`

## 📝 Key Features

### For Students
- Browse and search hostels by area, category, and price
- View detailed hostel information with images and reviews
- Book hostels or individual room seats
- Manage bookings and wishlist
- Submit complaints
- Pay monthly rent with proof upload
- Chat with hostel owners
- Community chat by area

### For Hostel Owners
- Add and manage multiple hostels
- Add rooms to hostels with seat management
- View and manage booking requests
- Approve/reject bookings
- View and approve rent payments
- Handle student complaints
- Configure payment methods
- Analytics dashboard with booking charts
- Filter bookings by hostel, date, and status

### General Features
- Role-based authentication (Student/Owner)
- Profile management with ID verification
- Messaging system
- Review and rating system
- Mess menu management
- Responsive design

## 🔄 Migration from Old MySQL Version

If you have data in the old MySQL database:

1. **Backup your old database** first
2. **Export data** from MySQL tables
3. **Transform and import** to MongoDB using migration scripts
4. The old `app.js` is backed up as `app.js.backup`
5. The old `db.js` (MySQL connection) is no longer used

## 🛠️ API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Login user
- `GET /register` - Register page
- `POST /register` - Register user
- `GET /logout` - Logout user

### Hostels
- `GET /` - List all hostels (with filters)
- `GET /details/:id` - Hostel details
- `GET /compare` - Compare two hostels
- `POST /submit_review` - Submit review
- `GET /add_hostel` - Add hostel page (Owner)
- `POST /add_hostel` - Create hostel (Owner)
- `GET /edit_hostel/:id` - Edit hostel page (Owner)
- `POST /edit_hostel/:id` - Update hostel (Owner)
- `GET /delete_hostel/:id` - Delete hostel (Owner)

### Bookings
- `POST /book_hostel` - Book entire hostel
- `POST /book_seat` - Book room seat
- `GET /cancel_booking/:id` - Cancel booking
- `POST /submit_complaint` - Submit complaint
- `POST /pay_rent` - Upload rent proof
- `POST /toggle_wishlist` - Add/remove from wishlist

### Dashboards
- `GET /student_dashboard` - Student dashboard
- `GET /owner_dashboard` - Owner dashboard (with filters)
- `GET /owner_complaints` - View complaints

## 🔐 Security Improvements

- Password hashing with bcrypt (10 rounds)
- Session-based authentication
- Role-based access control middleware
- MongoDB injection protection (Mongoose sanitization)
- File upload validation and limits
- Secure session configuration

## 📊 Database Schema

MongoDB collections with Mongoose schemas:
- **users**: User accounts with roles
- **hostels**: Hostel listings
- **rooms**: Individual rooms within hostels
- **bookings**: Booking requests and approvals
- **reviews**: Hostel reviews and ratings
- **wishlists**: Student wishlist items
- **complaints**: Student complaints
- **rentpayments**: Monthly rent payment records
- **messages**: Private messages
- **communitymessages**: Area-based community chat
- **messmenus**: Weekly mess menus
- **paymentsettings**: Owner payment configurations
- **contactmessages**: Contact form submissions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

ISC

## 👨‍💻 Support

For issues or questions, please open an issue on the GitHub repository.

---

**Note**: This is a refactored version using MVC architecture and MongoDB. The original MySQL version is backed up as `app.js.backup` and `db.js`.
