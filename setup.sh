#!/bin/bash

# Order Execution Engine - Setup Script
# This script automates the setup process

set -e

echo "🚀 Order Execution Engine Setup"
echo "================================"
echo ""

# Check Node.js
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) detected"
echo ""

# Check PostgreSQL
echo "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL 15+ manually."
else
    echo "✅ PostgreSQL detected"
fi
echo ""

# Check Redis
echo "Checking Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis not found. Please install Redis 7+ manually."
else
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is installed but not running. Starting Redis..."
        # Attempt to start Redis (platform-specific)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew services start redis || echo "Please start Redis manually: brew services start redis"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo systemctl start redis || echo "Please start Redis manually: sudo systemctl start redis"
        fi
    fi
fi
echo ""

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update database credentials in .env if needed"
else
    echo "✅ .env file already exists"
fi
echo ""

# Create database
echo "🗄️  Setting up database..."
read -p "Do you want to create the database now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DB_NAME="order_execution"
    
    # Try to create database
    if command -v createdb &> /dev/null; then
        createdb $DB_NAME 2>/dev/null && echo "✅ Database '$DB_NAME' created" || echo "ℹ️  Database may already exist"
    else
        echo "⚠️  Please create database manually:"
        echo "   psql -U postgres -c \"CREATE DATABASE $DB_NAME;\""
    fi
fi
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
echo "✅ Build complete"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials (if needed)"
echo "2. Start the server: npm run dev"
echo "3. Test the API: curl http://localhost:3000/health"
echo "4. Import postman_collection.json into Postman"
echo ""
echo "For detailed instructions, see SETUP.md"
echo ""
echo "Happy coding! 🚀"
