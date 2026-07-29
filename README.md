# Meeting Room Booking

A web application for booking meeting rooms in an office. Employees can view room schedules, see occupied time slots, and reserve available times. Users can cancel their own bookings but cannot modify others' reservations.

## Purpose

This project implements a small office meeting-room booking system where staff can:

- Register and sign in with persistent sessions
- Browse 5–6 seeded meeting rooms with weekly schedule grids (30-minute slots)
- Create bookings within office hours (09:00–19:00, Europe/Kyiv)
- Cancel only their own bookings
- View times in their local timezone while validations run against office time

## Planned Features

### Authentication

- Registration with name, email, and password
- Login and logout with session persistence across page reloads
- Server-side validation (unique email, name required, password 8–72 characters)

### Rooms & Schedule

- 5–6 meeting rooms seeded with name, floor, and capacity
- Weekly schedule grid (days horizontal, time vertical) inspired by Google Calendar
- Navigate between weeks; highlight current day and time
- Display booking title and author on occupied slots
- User timezone display with office timezone indicator when different

### Bookings

- Create bookings: room, date, start/end time, title (1–100 characters)
- 30-minute slot alignment; duration 30 minutes to 4 hours
- Future bookings only, within office hours, no overlaps (adjacent slots allowed)
- Cancel own bookings with confirmation
- "My bookings" page with upcoming and past sections

### Technical Stack

- **Language:** TypeScript
- **Frontend:** React or Next.js
- **Backend:** NestJS, Express, or Next.js API routes
- **Database:** PostgreSQL, MySQL, or SQLite
- **Time storage:** UTC; custom schedule grid (no third-party calendar components)
- **Security:** Hashed passwords (bcrypt or argon2)
- **Testing:** Unit tests for booking interval overlap logic

## Project Structure

```
meeting-room-booking/
├── client/                 # React/Next.js frontend
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # UI components
│       ├── pages/          # Route-level views
│       ├── hooks/          # Reusable React hooks
│       ├── services/       # API client layer
│       ├── types/          # Shared TypeScript types
│       └── utils/          # Frontend helpers
├── server/                 # NestJS/Express backend
│   ├── src/
│   │   ├── modules/        # Feature modules / routes
│   │   ├── services/       # Business logic
│   │   ├── models/         # Data models / entities
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── config/         # App configuration
│   │   └── utils/          # Backend helpers
│   └── tests/              # Unit & integration tests
├── README.md
└── .gitignore
```

## Status

Basic project structure is in place. Application functionality is not yet implemented.

## License

Private project for UA-Skills event2 competition.
