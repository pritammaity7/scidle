#!/bin/sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$SCRIPT_DIR"

pids=""

cleanup() {
    echo ""
    echo "Shutting down all services..."

    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            service_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
            echo "  Stopping process $pid ($service_name)..."
            kill -TERM "$pid" 2>/dev/null
        fi
    done

    sleep 1
    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            timeout=4
            while [ $timeout -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
                sleep 1
                timeout=$((timeout - 1))
            done
            if kill -0 "$pid" 2>/dev/null; then
                echo "  Force stopping process $pid..."
                kill -KILL "$pid" 2>/dev/null
            fi
        fi
    done

    echo "All services stopped"
    exit 0
}

echo "Starting all services..."
echo ""

cd "$BUILD_DIR" || exit 1

ls -lah

if [ -f "./next-service-dist/server.js" ]; then
    echo "Starting Next.js server..."
    cd next-service-dist/ || exit 1

    export NODE_ENV=production
    export PORT=${PORT:-3000}
    export HOSTNAME=${HOSTNAME:-0.0.0.0}

    node server.js &
    NEXT_PID=$!
    pids="$NEXT_PID"

    sleep 1
    if ! kill -0 "$NEXT_PID" 2>/dev/null; then
        echo "Next.js server failed to start"
        exit 1
    else
        echo "Next.js server started (PID: $NEXT_PID, Port: $PORT)"
    fi

    cd ../
else
    echo "Next.js server file not found: ./next-service-dist/server.js"
fi

echo "Starting Caddy..."

echo ""
echo "All services started!"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

exec caddy run --config Caddyfile --adapter caddyfile
