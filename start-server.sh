#!/bin/bash

# Start the AO Process Builder API server

# Check if AOS is running
if ! pgrep -x "aos" > /dev/null
then
    echo "AOS is not running. Starting AOS..."
    aos &
    sleep 2
    echo "AOS started."
else
    echo "AOS is already running."
fi

# Start the API server
echo "Starting AO Process Builder API server..."
node src/index.js
