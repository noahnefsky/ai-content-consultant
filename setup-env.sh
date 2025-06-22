#!/bin/bash

# Setup environment files for AI Content Consultant

echo "Setting up environment files..."

# Frontend environment
if [ -f "frontend/env.local" ]; then
    mv frontend/env.local frontend/.env
    echo "✅ Frontend .env file created"
else
    echo "❌ Frontend env.local not found"
fi

# Backend environment
if [ -f "backend/service/api-service/env.local" ]; then
    mv backend/service/api-service/env.local backend/service/api-service/.env
    echo "✅ Backend .env file created"
else
    echo "❌ Backend env.local not found"
fi

echo ""
echo "📝 Next steps:"
echo "1. Edit frontend/.env and add your Google AI API key"
echo "2. Edit backend/service/api-service/.env and add your Google AI API key"
echo "3. Get your API key from: https://makersuite.google.com/app/apikey"
echo ""
echo "🔒 Remember: .env files are gitignored for security" 