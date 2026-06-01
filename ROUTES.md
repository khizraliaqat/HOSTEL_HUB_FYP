# Available Routes - HostelHub

## Public Routes (No Authentication Required)

### Pages
- `GET /` - Home page with hostel listings
- `GET /about` - About page
- `GET /contact` - Contact page
- `POST /contact` - Submit contact form
- `GET /community` - Community page
- `GET /area_chat?area=AreaName` - Area-specific community chat

### Authentication
- `GET /login` - Login page
- `POST /login` - Login submission
- `GET /register` - Registration page
- `POST /register` - Registration submission
- `GET /logout` - Logout

### Hostel Browsing
- `GET /details/:id` - View hostel details (requires valid hostel ID)
- `GET /room_details/:room_id` - View room details (requires valid room ID)
- `GET /compare?h1=:id1&h2=:id2` - Compare two hostels

## Student Routes (Require Student Login)

### Dashboard
- `GET /student_dashboard` - Student dashboard with bookings, complaints, wishlist

### Bookings
- `POST /book_hostel` - Book a hostel
- `POST /book_seat` - Book a room seat
- `GET /cancel_booking/:id` - Cancel a booking
- `POST /toggle_wishlist` - Add/remove hostel from wishlist

### Complaints & Payments
- `POST /submit_complaint` - Submit a complaint
- `POST /pay_rent` - Upload rent payment proof

### Profile & Chat
- `GET /profile` - View/edit profile
- `POST /update_profile` - Update profile information
- `GET /chat_list` - List all chat conversations
- `GET /chat/:id` - Chat with specific user (requires valid user ID)
- `POST /api_chat` - Send/receive chat messages (AJAX)

### Reviews
- `POST /submit_review` - Submit a hostel review

## Owner Routes (Require Owner Login)

### Dashboard
- `GET /owner_dashboard` - Owner dashboard with bookings & statistics
  - Query params: `?hostel_id=X&date=YYYY-MM-DD&status=Pending`
- `GET /owner_complaints` - View student complaints

### Hostel Management
- `GET /add_hostel` - Add new hostel page
- `POST /add_hostel` - Create new hostel
- `GET /edit_hostel/:id` - Edit hostel page (requires valid hostel ID)
- `POST /edit_hostel/:id` - Update hostel
- `GET /delete_hostel/:id` - Delete hostel
- `GET /manage_hostel/:id` - Manage hostel announcement (requires valid hostel ID)
- `POST /manage_hostel` - Update hostel announcement

### Room Management
- `GET /add_room/:hostel_id` - Add room page (requires valid hostel ID)
- `POST /add_room/:hostel_id` - Create new room

### Mess Management
- `GET /manage_mess/:id` - Manage mess menu page (requires valid hostel ID)
- `POST /manage_mess` - Update mess menu

### Booking Management
- `GET /update_booking/:id/:status` - Approve/reject booking
  - Status: `Approved` or `Rejected`

### Complaint Management
- `GET /resolve_complaint/:id` - Mark complaint as resolved

### Payment Management
- `GET /approve_rent/:id` - Approve rent payment
- `GET /payment_settings` - Payment settings page
- `POST /save_payment_settings` - Update payment settings

## API Endpoints

### Chat API
- `POST /api_chat` - Send/fetch messages
  - Body: `{ action: 'send|fetch', receiver_id: 'X', message: 'text' }`

### Community API
- `POST /api_community` - Send/fetch community messages
  - Body: `{ action: 'send|fetch', area: 'AreaName', message: 'text', name: 'GuestName' }`

## Important Notes

### Routes Requiring IDs
Many routes require valid MongoDB ObjectIDs (24-character hex strings). Examples:

❌ **Wrong:** `/details/` (missing ID)  
✅ **Correct:** `/details/507f1f77bcf86cd799439011`

❌ **Wrong:** `/edit_hostel/` (missing ID)  
✅ **Correct:** `/edit_hostel/507f1f77bcf86cd799439011`

❌ **Wrong:** `/add_room/` (missing hostel_id)  
✅ **Correct:** `/add_room/507f1f77bcf86cd799439011`

### Testing Routes

1. **Create test data first:**
   - Register as Owner
   - Add a hostel (you'll get an ID)
   - Use that ID in routes like `/edit_hostel/:id`

2. **Get IDs from database:**
   ```javascript
   // In MongoDB shell or Compass
   db.hostels.find({}, {_id: 1, name: 1})
   db.users.find({}, {_id: 1, email: 1})
   ```

3. **Common workflow:**
   ```
   1. Register → /register
   2. Login → /login
   3. View dashboard → /student_dashboard or /owner_dashboard
   4. Create hostel (Owner) → /add_hostel
   5. View hostel → /details/:hostel_id
   6. Book hostel (Student) → POST /book_hostel
   ```

## Error Handling

- **404 Not Found** - Route doesn't exist or missing required ID parameter
- **401 Unauthorized** - Not logged in
- **403 Forbidden** - Wrong role (e.g., student accessing owner route)
- **500 Server Error** - Database or server issue

## Quick Access Links (After Login)

### For Students:
- Dashboard: `http://localhost:3000/student_dashboard`
- Browse Hostels: `http://localhost:3000/`
- Profile: `http://localhost:3000/profile`
- Chats: `http://localhost:3000/chat_list`

### For Owners:
- Dashboard: `http://localhost:3000/owner_dashboard`
- Add Hostel: `http://localhost:3000/add_hostel`
- Complaints: `http://localhost:3000/owner_complaints`
- Payment Settings: `http://localhost:3000/payment_settings`
