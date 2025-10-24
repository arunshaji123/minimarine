# Marine Survey Application

A full-stack web application for marine surveying services built with React, Node.js, Express, and MongoDB.

## Features

- **User Authentication**: Register and login functionality
- **Responsive Design**: Built with Tailwind CSS for mobile-first design
- **Dashboard**: User dashboard with survey overview and statistics
- **MongoDB Integration**: User data stored in MongoDB database
- **JWT Authentication**: Secure token-based authentication
- **Modern UI**: Ocean-themed design with gradient backgrounds

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- React Router DOM
- Axios for API calls
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing
- Express Validator for input validation

## Project Structure

```
marine_survay/
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # Context providers
│   │   └── ...
│   └── package.json
├── backend/                  # Node.js backend
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── server.js            # Main server file
│   └── package.json
└── package.json             # Root package.json
```

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd marine_survay
```

### 2. Install dependencies for all parts
```bash
npm run install-all
```

Or install manually:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set up MongoDB

#### Option A: Local MongoDB
- Install MongoDB locally
- Start MongoDB service
- The application will connect to `mongodb://localhost:27017/marine_survey`

#### Option B: MongoDB Atlas (Cloud)
- Create a MongoDB Atlas account
- Create a new cluster
- Get your connection string
- Update the `MONGODB_URI` in `backend/.env`

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/marine_survey
JWT_SECRET=your_jwt_secret_key_here_change_in_production
NODE_ENV=development
```

**Important**: Change the `JWT_SECRET` to a secure random string in production.

### 5. Start the Application

#### Development Mode (Both frontend and backend)
```bash
npm run dev
```

#### Start Backend Only
```bash
npm run server
```

#### Start Frontend Only
```bash
npm run client
```

## Usage

1. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

2. **Register a New Account**
   - Go to http://localhost:3000
   - Click "Register" or "Get Started"
   - Fill in your details (name, email, password)
   - Submit the form

3. **Login**
   - Use your registered email and password
   - Click "Sign In"

4. **Dashboard**
   - After successful login, you'll be redirected to the dashboard
   - View your profile information
   - See dummy survey data and statistics

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Request/Response Examples

#### Register
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

## Database Schema

### User Model
```javascript
{
  name: String (required, min: 2 chars),
  email: String (required, unique, valid email),
  password: String (required, min: 6 chars, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  createdAt: Date (default: now)
}
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation with express-validator
- CORS enabled for cross-origin requests
- Protected routes requiring authentication

## Customization

### Styling
- Modify `frontend/src/index.css` for global styles
- Update `frontend/tailwind.config.js` for Tailwind customization
- Colors can be changed in the Tailwind config

### Adding New Features
- Add new routes in `backend/routes/`
- Create new React components in `frontend/src/components/`
- Update the database models in `backend/models/`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`
   - Verify network connectivity for Atlas

2. **Port Already in Use**
   - Change the PORT in `backend/.env`
   - Kill processes using the ports: `npx kill-port 3000 5000`

3. **CORS Issues**
   - Ensure the proxy is set in `frontend/package.json`
   - Check CORS configuration in `backend/server.js`

4. **JWT Token Issues**
   - Clear localStorage in browser
   - Check JWT_SECRET in environment variables

## Development

### Adding New Components
```bash
# Create new component
touch frontend/src/components/NewComponent.js
```

### Adding New API Routes
```bash
# Create new route file
touch backend/routes/newRoute.js
```

### Database Operations
```javascript
// Example: Add new field to User model
// Update backend/models/User.js
```

## Production Deployment

1. **Environment Variables**
   - Set secure JWT_SECRET
   - Use production MongoDB URI
   - Set NODE_ENV=production

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**
   - Deploy backend to services like Heroku, Railway, or DigitalOcean
   - Deploy frontend to Netlify, Vercel, or serve from Express

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please create an issue in the repository or contact the development team.