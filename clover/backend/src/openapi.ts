import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Clover API",
      version: "1.0.0",
      description: `
Clover platform API for managing data collection, earnings, and payouts.

## Authentication

**User endpoints** require a JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
Get a token by calling POST /api/auth/login or POST /api/auth/signup.

**Admin endpoints** require an API key in the X-API-Key header:
\`\`\`
X-API-Key: <your-admin-key>
\`\`\`

## Response Format

All endpoints return JSON with a consistent shape:
\`\`\`json
{
  "success": true,
  "data": { ... }
}
\`\`\`

On error:
\`\`\`json
{
  "success": false,
  "error": "description of what went wrong"
}
\`\`\`

Paginated endpoints include:
\`\`\`json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 100, "page": 1, "limit": 50, "totalPages": 2 }
}
\`\`\`
      `,
    },
    servers: [
      { url: "http://localhost:4000", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token from /api/auth/login or /api/auth/signup",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Admin API key (set in .env as ADMIN_API_KEY)",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
