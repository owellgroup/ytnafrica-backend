# Docker Setup Guide

This guide explains how to build and run the MLMusik backend using Docker.

## Prerequisites

- Docker installed and running
- Docker Compose (optional, for easier setup)

## Quick Start with Docker Compose

The easiest way to run the backend with PostgreSQL:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

The backend will be available at: `http://localhost:8080/api`

## Manual Docker Build

### 1. Build the Docker Image

```bash
docker build -t mlmusik-backend:latest .
```

### 2. Run the Container

```bash
docker run -d \
  --name mlmusik-backend \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/mlmusik \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -v $(pwd)/uploads:/app/uploads \
  mlmusik-backend:latest
```

### 3. View Logs

```bash
docker logs -f mlmusik-backend
```

## Environment Variables

You can override these environment variables:

- `SPRING_DATASOURCE_URL` - PostgreSQL connection URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `SPRING_PROFILES_ACTIVE` - Spring profile (default: prod)
- `JAVA_OPTS` - JVM options (default: "-Xms256m -Xmx1024m")

## Volumes

The `/app/uploads` directory is mounted as a volume to persist uploaded files:
- Cover art: `/app/uploads/cover-art`
- Songs: `/app/uploads/songs`

## Production Considerations

1. **Database**: Use a managed PostgreSQL service or separate container
2. **Secrets**: Use Docker secrets or environment files for sensitive data
3. **Resource Limits**: Set appropriate memory/CPU limits
4. **Health Checks**: The container exposes port 8080 for health checks
5. **Logging**: Configure log aggregation for production

## Troubleshooting

### Container won't start
- Check logs: `docker logs mlmusik-backend`
- Verify database connection settings
- Ensure port 8080 is not already in use

### Database connection errors
- Verify PostgreSQL is running and accessible
- Check network connectivity between containers
- Verify database credentials

### File upload issues
- Ensure upload directory has proper permissions
- Check volume mount is working: `docker exec mlmusik-backend ls -la /app/uploads`

