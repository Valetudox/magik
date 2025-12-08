# Health Checks

## HTTP Health Check

All services MUST implement a `/health` endpoint:

```typescript
fastify.get('/health', async () => {
  return { status: 'ok' }
})
```

## Docker Health Check

All Dockerfiles MUST include a HEALTHCHECK directive:

```dockerfile
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:{port}/health || exit 1
```
