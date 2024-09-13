# Use a specific version of Python, defaulting to 3.12.4
ARG PYTHON_VERSION=3.12.4
FROM python:${PYTHON_VERSION}-slim as base

# Prevent Python from writing pyc files and keep Python from buffering stdout and stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Create a non-privileged user that the app will run under
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file
COPY requirements.txt .

# Install the application dependencies
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# Copy the application code and other necessary files
COPY . .

# Create necessary directories and files
RUN mkdir -p static/img && touch urls.json config.json users.json

# Adjust ownership of the app files to the appuser
RUN chown -R appuser:appuser /app

# Switch to the non-privileged user to run the application
USER appuser

# Expose the port that the Flask application will listen on
EXPOSE 7237

# Run the Flask application using Waitress
CMD ["python", "-m", "waitress", "--host=0.0.0.0", "--port=7237", "app:app"]