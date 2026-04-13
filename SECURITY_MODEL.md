# Security Model

Extraktr is designed with production-grade security practices.

## Key Principles

- No secrets exposed to frontend
- All validation performed server-side
- Authenticated access for protected routes
- Rate limiting on sensitive endpoints

## Integrations

- OAuth tokens encrypted at rest
- No direct exposure to client
- Scoped access only

## Data Handling

- No long-term storage of sensitive conversation data by default
- Logs sanitized for sensitive fields
