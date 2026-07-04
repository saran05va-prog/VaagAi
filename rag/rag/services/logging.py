"""
Structured Logging Module
Provides JSON logging for production.
"""

import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict
from pythonjsonlogger import jsonlogger


class StructuredLogger:
    """Structured JSON logger for production."""

    def __init__(self, name: str, level: int = logging.INFO):
        """
        Initialize structured logger.

        Args:
            name: Logger name
            level: Logging level
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(level)

        # Add JSON handler
        handler = logging.StreamHandler(sys.stdout)
        formatter = jsonlogger.JsonFormatter(
            fmt="%(asctime)s %(name)s %(levelname)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.propagate = False

    def log(
        self,
        level: int,
        message: str,
        extra: Dict[str, Any] = None,
    ):
        """
        Log a structured message.

        Args:
            level: Logging level
            message: Log message
            extra: Additional fields
        """
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "message": message,
        }

        if extra:
            log_data.update(extra)

        self.logger.log(level, json.dumps(log_data))

    def info(self, message: str, **kwargs):
        """Log info message."""
        self.log(logging.INFO, message, kwargs)

    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.log(logging.WARNING, message, kwargs)

    def error(self, message: str, **kwargs):
        """Log error message."""
        self.log(logging.ERROR, message, kwargs)


# Request logging helper
class RequestLogger:
    """Logger for API requests with structured data."""

    def __init__(self):
        self.logger = StructuredLogger("rag.requests")

    def log_request(
        self,
        endpoint: str,
        question: str,
        tool_used: str,
        latency_ms: float,
        status_code: int = 200,
        sources_count: int = 0,
        error: str = None,
    ):
        """
        Log an API request with structured data.

        Args:
            endpoint: API endpoint called
            question: User question
            tool_used: Which tool was used
            latency_ms: Request latency in milliseconds
            status_code: HTTP status code
            sources_count: Number of sources retrieved
            error: Error message if any
        """
        extra = {
            "endpoint": endpoint,
            "question": question[:100],  # Truncate for logging
            "question_length": len(question),
            "tool_used": tool_used,
            "latency_ms": round(latency_ms, 2),
            "status_code": status_code,
            "sources_count": sources_count,
        }

        if error:
            extra["error"] = error

        if status_code >= 400:
            self.logger.error(f"Request failed: {endpoint}", **extra)
        else:
            self.logger.info(f"Request: {endpoint}", **extra)


# Create default loggers
request_logger = RequestLogger()