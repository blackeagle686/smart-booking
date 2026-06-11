#!/bin/bash

# Navigate to the script's directory so it can be run from anywhere
cd "$(dirname "$0")"

function run_servers() {
    echo "Starting Redis server..."
    redis-server > redis.log 2>&1 &
    REDIS_PID=$!
    echo $REDIS_PID > redis.pid
    echo "Redis server started with PID $REDIS_PID (Port 6379)"

    echo "Starting backend server..."
    cd backend
    source venv/bin/activate
    python manage.py runserver > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    echo "Backend server started with PID $BACKEND_PID (Port 8000)"
    cd ..

    echo "Starting frontend server..."
    cd frontend
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    echo "Frontend server started with PID $FRONTEND_PID (Port 5173)"
    cd ..
    
    echo "Servers are running in the background."
    echo "Use './dev.sh logs back' or './dev.sh logs front' to view logs."
}

function stop_servers() {
    echo "Stopping Redis server..."
    if [ -f "redis.pid" ]; then
        PID=$(cat redis.pid)
        kill $PID 2>/dev/null
        rm redis.pid
        echo "Redis server stopped."
    else
        echo "redis.pid not found."
    fi
    # Fallback to kill orphaned redis servers
    pkill -f "redis-server" 2>/dev/null

    echo "Stopping backend server..."
    if [ -f "backend.pid" ]; then
        PID=$(cat backend.pid)
        kill $PID 2>/dev/null
        rm backend.pid
        echo "Backend server stopped."
    else
        echo "backend.pid not found."
    fi
    # Fallback to kill any orphaned runserver processes
    pkill -f "python manage.py runserver" 2>/dev/null

    echo "Stopping frontend server..."
    if [ -f "frontend.pid" ]; then
        PID=$(cat frontend.pid)
        # Kill the npm process and its children (vite)
        pkill -P $PID 2>/dev/null
        kill $PID 2>/dev/null
        rm frontend.pid
        echo "Frontend server stopped."
    else
        echo "frontend.pid not found."
    fi
    # Fallback to kill any orphaned vite processes
    pkill -f "vite" 2>/dev/null

    echo "All development servers have been stopped."
}

function show_logs() {
    if [ "$1" == "front" ]; then
        if [ -f "frontend.log" ]; then
            echo "Tailing frontend logs (Ctrl+C to exit)..."
            tail -f frontend.log
        else
            echo "Frontend log file not found."
        fi
    elif [ "$1" == "back" ]; then
        if [ -f "backend.log" ]; then
            echo "Tailing backend logs (Ctrl+C to exit)..."
            tail -f backend.log
        else
            echo "Backend log file not found."
        fi
    else
        echo "Usage: ./dev.sh logs [front|back]"
    fi
}

case "$1" in
    run)
        run_servers
        ;;
    stop)
        stop_servers
        ;;
    logs)
        show_logs "$2"
        ;;
    *)
        echo "Usage: ./dev.sh {run|stop|logs}"
        echo "  run         - Start both backend and frontend servers in the background"
        echo "  stop        - Stop both servers"
        echo "  logs front  - View frontend logs"
        echo "  logs back   - View backend logs"
        exit 1
        ;;
esac
