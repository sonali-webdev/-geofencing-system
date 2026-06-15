# Geofencing Real-time Alert System - Setup Guide

## 🏗️ Architecture
- **Backend**: Go (Gin framework) - REST API + WebSocket
- **Frontend**: React + Vite + Tailwind CSS + Leaflet Maps
- **Database**: PostgreSQL
- **Real-time**: WebSocket for live alerts
- **Container**: Docker + Docker Compose

## 🌐 Deployed URLs
- **Frontend**: https://YOUR-APP.vercel.app
- **Backend**: https://geofencing-backend-sx5z.onrender.com
- **Docker Hub**: https://hub.docker.com/r/sonaligupta12/geofencing-backend

## 📋 Prerequisites
- Go 1.23+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose

## 🚀 Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/sonali-webdev/geofencing-system.git
cd geofencing-system

2. Backend Setup
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=yourpassword
# DB_NAME=geofencing_db
# PORT=8080

# Install dependencies
go mod tidy


3. Database Setup
# Create database in PostgreSQL
psql -U postgres -c "CREATE DATABASE geofencing_db;"

# Run schema
psql -U postgres -d geofencing_db -f backend/database/schema.sql

4. Frontend Setup
cd frontend

# Install dependencies
npm install

# Create .env file
# VITE_API_URL=http://localhost:8080
# VITE_WS_URL=ws://localhost:8080

# Run frontend
npm run dev

5. Access Application
Frontend: http://localhost:5173
Backend:  http://localhost:8080

🐳 Docker Setup
# Run everything with one command
docker-compose up --build

# Access:
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080

🔌 API Endpoints
Method	Endpoint	Description
POST	/geofences	Create geofence
GET	/geofences	Get all geofences
GET	/geofences?category=xxx	Filter by category
POST	/vehicles	Register vehicle
GET	/vehicles	Get all vehicles
POST	/vehicles/location	Update vehicle location
GET	/vehicles/location/:id	Get vehicle location
POST	/alerts/configure	Configure alert rule
GET	/alerts	Get all alerts
GET	/violations/history	Get violation history
WS	/ws/alerts	WebSocket real-time alerts

🧪 API Testing with curl
Create Geofence
curl -X POST https://geofencing-backend-sx5z.onrender.com/geofences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Zone",
    "description": "Test zone",
    "coordinates": [
      [37.7749, -122.4194],
      [37.7849, -122.4194],
      [37.7849, -122.4094],
      [37.7749, -122.4094],
      [37.7749, -122.4194]
    ],
    "category": "restricted_zone"
  }'

Register Vehicle
 curl -X POST https://geofencing-backend-sx5z.onrender.com/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_number": "KA-01-AB-1234",
    "driver_name": "John Doe",
    "vehicle_type": "truck",
    "phone": "+1234567890"
  }'

Update Vehicle Location (Triggers Alert!)
   curl -X POST https://geofencing-backend-sx5z.onrender.com/vehicles/location \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "veh_xxxxxxxx",
    "latitude": 37.7799,
    "longitude": -122.4144,
    "timestamp": "2025-01-15T10:35:00Z"
  }'


 Get All Geofences
curl https://geofencing-backend-sx5z.onrender.com/geofences

Get Violation History
curl https://geofencing-backend-sx5z.onrender.com/violations/history

📡 WebSocket Connection
Connect to: wss://geofencing-backend-sx5z.onrender.com/ws/alerts

Alert message format:
{
  "event_id": "evt_xxx",
  "event_type": "entry",
  "timestamp": "2025-01-15T10:35:00Z",
  "vehicle": {
    "vehicle_id": "veh_xxx",
    "vehicle_number": "KA-01-AB-1234",
    "driver_name": "John Doe"
  },
  "geofence": {
    "geofence_id": "geo_xxx",
    "geofence_name": "Downtown Zone",
    "category": "restricted_zone"
  },
  "location": {
    "latitude": 37.7799,
    "longitude": -122.4144
  }
}

🎯 How to Test Real-time Alerts
Open frontend at deployed URL
Go to Geofences → Create a geofence
Go to Vehicles → Register a vehicle
Go to Alerts → Configure alert rule
Go to Vehicles → Click "Update Location"
Enter coordinates INSIDE the geofence
Watch real-time alert appear! 🚨

⚠️ Note on Free Tier
Backend hosted on Render free tier.
First request may take 30-50 seconds if service was inactive.
This is normal behavior for free hosting!

🏛️ Project Structure
geofencing-system/
├── backend/                 # Go backend
│   ├── main.go             # Entry point
│   ├── config/             # Database config
│   ├── handlers/           # API handlers
│   ├── models/             # Data structures
│   ├── services/           # Business logic
│   ├── websocket/          # WebSocket hub
│   └── database/           # SQL schema
├── frontend/               # React frontend
│   ├── src/
│   │   ├── pages/          # All pages
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Global state
│   │   ├── hooks/          # Custom hooks
│   │   └── services/       # API calls
│   └── Dockerfile
├── docker-compose.yml      # Docker setup
└── SETUP.md               # This file


---





