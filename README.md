# QuoteForge Web

A full-stack web application for automating the quoting process at Kastel Technologies.

## Features

- **Quote Management**: Create, edit, view, and delete quotes with dynamic line items
- **Real-time Calculations**: Landed cost, markup, VAT - matching Excel formulas exactly
- **Approval Workflow**: Automatic flagging for low-margin quotes with approver review
- **PDF/Excel Export**: Professional quote documents for customers
- **Role-Based Access**: Admin, Creator, Approver, and Viewer roles
- **Reference Data Management**: Suppliers, categories, FX rates, and app settings
- **Audit Logging**: Track all changes and approvals

## Technology Stack

- **Frontend**: React 18 + Vite + Material-UI
- **Backend**: Node.js 22 + Express.js
- **Database**: PostgreSQL 16
- **Auth**: JWT with bcrypt password hashing
- **Deployment**: Docker + Nginx

## Quick Start (Development)

### Prerequisites

- Node.js 22+
- PostgreSQL 16+
- npm or yarn

### 1. Clone and Install

```bash
cd quoteforge-web

# Install server dependencies
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials

# Install client dependencies
cd ../client
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE quoteforge;"
psql -U postgres -c "CREATE USER quoteforge WITH PASSWORD 'quoteforge_secret';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE quoteforge TO quoteforge;"

# Run migrations and seed data
cd server
npm run migrate
node src/seed.js
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

Visit <http://localhost:5173>

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | <admin@kastel.local> | admin123 |
| Creator | <creator@kastel.local> | creator123 |
| Approver | <approver@kastel.local> | approver123 |

## Production Deployment (Docker)

### 1. Build Frontend

```bash
cd client
npm run build
```

### 2. Configure Environment

```bash
# Create production environment file
cp .env.example .env.production

# Edit with production values:
# - Strong DB_PASSWORD
# - Strong JWT_SECRET
# - Correct FRONTEND_URL
```

### 3. Deploy with Docker Compose

```bash
docker-compose up -d
```

### 4. Initialize Database

```bash
docker exec quoteforge-api node src/seed.js
```

The application will be available at <http://your-server-ip>

## Project Structure

```
quoteforge-web/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context (Auth)
│   │   ├── services/       # API services
│   │   ├── utils/          # Calculation utilities
│   │   └── theme/          # MUI theme
│   └── package.json
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── services/       # Business logic
│   │   └── config/         # Configuration
│   ├── Dockerfile
│   └── package.json
│
├── docker/
│   └── nginx.conf
│
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| GET | /api/auth/me | Get current user |
| GET | /api/quotes | List quotes |
| POST | /api/quotes | Create quote |
| GET | /api/quotes/:id | Get quote |
| PUT | /api/quotes/:id | Update quote |
| DELETE | /api/quotes/:id | Delete quote |
| POST | /api/quotes/:id/submit | Submit for approval |
| POST | /api/quotes/:id/approve | Approve quote |
| POST | /api/quotes/:id/reject | Reject quote |
| GET | /api/quotes/:id/export/pdf | Export PDF |
| GET | /api/quotes/:id/export/excel | Export Excel |
| GET | /api/suppliers | List suppliers |
| GET | /api/categories | List categories |
| GET | /api/fx-rates | List FX rates |
| GET | /api/settings | Get app settings |

## Calculation Formula

From the Excel reference, the landed cost calculation is:

```
Landed Cost = Buy Price × (1 + Freight%) × (1/FX Rate) × (1 + Duty%) × (1 + Handling%)
Markup = Landed Cost × Markup%
Unit Sell (Ex VAT) = Landed Cost + Markup
Line Total (Ex VAT) = Unit Sell × Quantity
VAT = Line Total × VAT Rate
Line Total (Inc VAT) = Line Total + VAT
```

## License

Proprietary - Kastel Technologies
