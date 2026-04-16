# Backend API

A simple backend API with Hello World endpoint using TypeScript, Express, tsoa for automatic documentation, and Mongoose for MongoDB integration.

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
GEMINI_MODEL=gemini-1.5-flash
GEMINI_DEFAULT_TEMPERATURE=0.2
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

### Hello World

- `GET /hello/` - Get the latest Hello World message
- `GET /hello/create` - Create a new Hello World message in the database

### Gemini

- `GET /gemini/health` - Check whether Gemini is configured and which model is active
- `GET /gemini/frontend-config` - Return frontend-facing Gemini defaults, limits, and endpoint paths
- `POST /gemini/generate` - Send a generic prompt to Gemini
- `POST /gemini/screen-candidate` - Score a candidate against structured job requirements
- `POST /gemini/screen-run` - Process a frontend screening run across multiple candidates and return ranked results

### Documentation

- `GET /docs` - Swagger UI documentation
- `GET /` - Redirects to documentation (if database is connected)

## Project Structure

```
backend_api/
├── config/
│   └── database.ts       # MongoDB connection
├── controllers/
│   ├── GeminiController.ts      # Gemini API endpoints
│   └── HelloWorldController.ts  # API controllers
├── gemini/
│   ├── config.ts         # Centralized Gemini environment and frontend defaults
│   ├── client.ts         # Gemini REST client
│   ├── frontend.ts       # Frontend-facing screening run service
│   ├── prompts.ts        # Screening prompt builders
│   ├── screening.ts      # Candidate screening service
│   └── types.ts          # Gemini request/response types
├── models/
│   └── HelloWorld.ts     # Mongoose models
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
