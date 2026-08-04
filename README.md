# Meeting Room Booking

A web application for booking meeting rooms in an office. Employees can view room schedules, see occupied time slots, and reserve available times. Users can cancel their own bookings but cannot modify others' reservations.

## Purpose

This project implements a small office meeting room booking system where staff can register and sign in with persistent sessions, browse 5 to 6 seeded meeting rooms with weekly schedule grids showing 30-minute slots, create bookings within office hours from 9am to 7pm Kyiv time, cancel only their own bookings, and view times in their local timezone while validations run against office time.

## Planned Features

### Authentication

Registration requires name, email, and password. Login and logout maintain session persistence across page reloads. Server-side validation enforces unique email addresses, required names, and passwords between 8 and 72 characters.

### Rooms and Schedule

The system includes 5 to 6 meeting rooms seeded with name, floor, and capacity. The weekly schedule grid displays days horizontally and time vertically, inspired by Google Calendar. Users can navigate between weeks with the current day and time highlighted. Occupied slots display the booking title and author name. The interface shows user timezone with an office timezone indicator when they differ.

### Bookings

Creating a booking requires selecting a room, date, start and end time, and a title between 1 and 100 characters. Bookings align to 30-minute slots with durations from 30 minutes to 4 hours. Only future bookings are allowed, must fall within office hours, and cannot overlap with existing bookings, though adjacent slots are permitted. Users can cancel their own bookings with confirmation. A dedicated page shows bookings organized into upcoming and past sections.

### Technical Stack

The application uses TypeScript throughout. The frontend is built with React or Next.js. The backend runs on NestJS, Express, or Next.js API routes. Data is stored in PostgreSQL, MySQL, or SQLite. All times are stored in UTC with a custom schedule grid implementation without third-party calendar components. Passwords are hashed using bcrypt or argon2. Unit tests cover booking interval overlap logic.

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
