# VaagAI RAG Service Dockerfile
# Build: docker build -t vaagai-rag:latest -f rag/Dockerfile .
# Run: docker run -p 8001:8001 --env-file rag/.env vaagai-rag:latest

FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY rag/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy RAG application
COPY rag/ /app/rag
COPY rag/agent /app/agent
COPY rag/eval /app/eval

# Create data directories
RUN mkdir -p /app/data/chroma_db /app/data/documents

# Expose port
EXPOSE 8001

# Run the application
CMD ["python", "-m", "rag.app.main"]