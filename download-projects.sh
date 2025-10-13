#!/bin/bash

# PNRR Projects Excel Export Script
# This script runs the Node.js project data export tool

echo "🎯 PNRR Projects Excel Export"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if package.json exists
if [ -f "package-projects-excel.json" ]; then
    echo "📦 Installing dependencies..."
    npm install --package-lock-only --package-lock=package-projects-excel-lock.json
    npm install xlsx@^0.18.5 node-fetch@^2.7.0
fi

# Run the export script
echo "🚀 Starting project data export..."
node download-projects-excel.cjs

echo "✅ Export completed!"
