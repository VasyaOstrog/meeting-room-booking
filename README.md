# Meeting Room Booking

A web application for booking meeting rooms in an office. Employees can view available rooms, see current bookings, and reserve time slots through a simple web interface.

## Features

### Implemented

- **Rooms** — list meeting rooms with name, floor, and capacity
- **Bookings** — view all bookings with title, room, time range, and status
- **Create booking** — web form with client-side and server-side validation
- **Booking rules**
  - Office hours: 09:00–19:00 (Europe/Kyiv)
  - 30-minute time slots; duration from 30 minutes to 4 hours
  - Future bookings only; no overlapping reservations (adjacent slots allowed)
  - Title length: 1–100 characters
- **Error handling** — clear API and UI feedback for validation, conflicts, and network errors
- **Health check** — `GET /api/health` reports API and database status
- **Tests** — booking validation logic and API endpoint tests

### Planned

- User registration, login, and session management
- Weekly schedule grid (Google Calendar style)
- Cancel own bookings
- Seed 5–6 meeting rooms on startup
- Timezone display for users outside office time

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | HTML, CSS, vanilla JavaScript       |
| Backend  | Node.js, Express, TypeScript        |
| Database | SQLite (`better-sqlite3`)           |
| Tests    | Node.js test runner, Supertest      |

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or newer (required by `better-sqlite3`)
- npm (included with Node.js)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd meeting-room-booking
   ```

2. Install backend dependencies:

   ```bash
   cd server
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   Default values in `.env.example`:

   ```env
   PORT=3001
   NODE_ENV=development
   DATABASE_PATH=./data/meeting-room-booking.sqlite
   ```

4. Build the server (optional for development — `npm run dev` uses `tsx` directly):

   ```bash
   npm run build
   ```

## How to Run

### 1. Start the backend

From the `server` directory:

```bash
npm run dev
```

Or, after building:

```bash
npm start
```

The API will be available at **http://localhost:3001/api**.

### 2. Start the frontend

The client is a static site. Serve the `client` folder with any static file server.

Using `npx serve`:

```bash
cd client
npx serve -l 5500
```

Then open **http://localhost:5500** in your browser.

> **Note:** The frontend expects the API at `http://localhost:3001/api` (see `client/js/config.js`). Change `API_BASE_URL` if your backend runs on a different host or port.

### 3. Add sample data (optional)

The database is created automatically on first run. To use the booking form, add at least one room and user. Example using the SQLite CLI:

```bash
cd server
sqlite3 data/meeting-room-booking.sqlite
```

```sql
INSERT INTO rooms (name, floor, capacity) VALUES ('Conference A', 1, 8);
INSERT INTO users (name, email, password_hash) VALUES ('Demo User', 'demo@example.com', 'placeholder');
```

## API Endpoints

| Method | Path            | Description              |
| ------ | --------------- | ------------------------ |
| GET    | `/api/health`   | Service and DB status    |
| GET    | `/api/rooms`    | List all rooms           |
| GET    | `/api/bookings` | List all bookings        |
| POST   | `/api/bookings` | Create a booking         |

**POST /api/bookings** body:

```json
{
  "roomId": 1,
  "userId": 1,
  "title": "Team standup",
  "startTime": "2030-06-15T06:00:00.000Z",
  "endTime": "2030-06-15T06:30:00.000Z"
}
```

Times are stored in UTC (ISO 8601). Validations use office timezone (Europe/Kyiv).

## Running Tests

From the `server` directory:

```bash
npm test
```

Tests cover booking validation (overlap logic, input rules) and API endpoints (CRUD flows, error responses).

## Project Structure

```
meeting-room-booking/
├── client/                 # Static frontend
│   ├── css/                # Styles
│   ├── js/                 # API client, validation, app logic
│   └── index.html
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Environment and database
│   │   ├── errors/         # Custom error types
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models and schema
│   │   ├── modules/        # Route handlers
│   │   ├── services/       # Business logic
│   │   └── utils/          # Validation helpers
│   └── tests/              # API and unit tests
└── README.md
```

## License

Private project for UA-Skills event2 competition.
