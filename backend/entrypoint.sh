#!/bin/bash
# run FastAPI app
echo "🚀 Starting FastAPI server..."
exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}
