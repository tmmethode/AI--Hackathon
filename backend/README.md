# Backend API

Backend service for the Umurava Screening platform, built with TypeScript, Express, tsoa, Mongoose, and Gemini integrations.

## Features

- **TypeScript**: Full TypeScript support with strict mode
- **Express**: Web framework for building REST APIs
- **tsoa**: Automatic OpenAPI/Swagger documentation generation
- **Mongoose**: MongoDB object modeling for Node.js
- **CORS**: Cross-origin resource sharing configured
- **Environment variables**: Secure configuration management

## Installation

```bash
npm install
```

## Environment Setup

Copy the environment example file:
```bash
cp .env.example .env
```

Update the `.env` file with your MongoDB connection string and Gemini credentials:
```
MONGODB_URI=mongodb://localhost:27017/helloworld
GEMINI_API_KEY=your-gemini-api-key
```

Optional Gemini tuning for frontend-driven screening:
```
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/models
GEMINI_MAX_OUTPUT_TOKENS=1200
GEMINI_FRONTEND_DEFAULT_SHORTLIST_SIZE=10
GEMINI_FRONTEND_MIN_SHORTLIST_SIZE=5
GEMINI_FRONTEND_MAX_SHORTLIST_SIZE=50
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project and generate documentation
- `npm start` - Start production server

## API Endpoints

### Core APIs

- `POST /auth/login` - Authenticate user credentials and issue a JWT
- `POST /auth/register` - Register a new user (admin-protected)
- `GET /auth/me` - Return the authenticated user profile
- `GET /jobs` - List job requisitions
- `POST /jobs` - Create a job requisition
- `GET /applicants` - List applicants
- `POST /applicants` - Create applicants (including ingestion payloads)
- `GET /shortlists` - List shortlist runs
- `POST /shortlists` - Persist shortlist outcomes
- `GET /notifications` - Retrieve in-app notifications

### Gemini APIs

- `GET /gemini/health` - Check whether Gemini is configured and which model is active
- `GET /gemini/frontend-config` - Return frontend-facing Gemini defaults, limits, and endpoint paths
- `POST /gemini/generate` - Send a generic prompt to Gemini
- `POST /gemini/screen-candidate` - Score a candidate against structured job requirements
- `POST /gemini/screen-run` - Process a frontend screening run across multiple candidates and return ranked results
- `POST /gemini/screen-batch` - Evaluate all applicants against a single job in one Gemini call using the weighted scoring model (Skills 35% / Experience 30% / Education 10% / Relevance 25%) and return a ranked shortlist limited by `shortlistCount`

### Documentation

- `GET /docs` - Swagger UI documentation
- `GET /` - Redirects to documentation (if database is connected)

## Project Structure

```
backend_api/
├── config/
│   └── database.ts       # MongoDB connection
├── controllers/
│   ├── ApplicantController.ts   # Applicant APIs
│   ├── AuthController.ts        # Authentication APIs
│   ├── GeminiController.ts      # Gemini endpoints
│   ├── JobController.ts         # Job requisition APIs
│   ├── NotificationController.ts # Notification APIs
│   └── ShortlistController.ts   # Shortlist APIs
├── gemini/
│   ├── config.ts         # Centralized Gemini environment and frontend defaults
│   ├── client.ts         # Gemini REST client
│   ├── frontend.ts       # Frontend-facing screening run service
│   ├── prompts.ts        # Screening prompt builders
│   ├── screening.ts      # Candidate screening service
│   └── types.ts          # Gemini request/response types
├── models/
│   ├── Applicant.ts      # Applicant model
│   ├── Job.ts            # Job model
│   ├── Shortlist.ts      # Shortlist model
│   └── User.ts           # User model
├── generated/           # Auto-generated tsoa routes
├── docs/               # Auto-generated swagger docs
├── index.ts            # Application entry point
├── server.ts           # Express server setup
├── package.json
├── tsconfig.json
├── tsoa.json
└── .env.example
```

## Development

The development server will automatically:
1. Generate tsoa routes and documentation
2. Watch for file changes
3. Restart the server on changes

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`
Documentation will be available at `http://localhost:3001/docs`
