# ==============================================================================
# Multi-Stage Production Dockerfile for RideMate FastAPI Backend
# ==============================================================================

# ---------- Stage 1: Build Dependencies ----------
FROM python:3.12-slim AS builder

WORKDIR /build

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy dependency definition
COPY pyproject.toml .

# Create virtual environment and install production dependencies
RUN uv venv /build/.venv && \
    uv pip install --no-cache -r pyproject.toml

# ---------- Stage 2: Production Runtime ----------
FROM python:3.12-slim AS runner

WORKDIR /app

# Install runtime PostgreSQL client library
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user
RUN groupadd -r ridemate && useradd -r -g ridemate -d /app -s /sbin/nologin ridemate

# Copy virtual environment from builder stage
COPY --from=builder /build/.venv /app/.venv
COPY . /app

# Ensure proper non-root permissions
RUN chown -R ridemate:ridemate /app

USER ridemate

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Expose API port
EXPOSE 8000

# Docker Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/liveness || exit 1

# Production server entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
