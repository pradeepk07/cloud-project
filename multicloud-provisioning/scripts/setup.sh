#!/bin/bash

echo "🚀 Setting up Multi-Cloud Provisioning System..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is required but not installed."
    echo "Please install Terraform from: https://www.terraform.io/downloads"
    exit 1
fi

echo "✅ All prerequisites are installed!"

# Setup backend
echo "📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd ..

# Setup frontend
echo "🎨 Setting up frontend..."
cd frontend
npm install
cd ..

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your cloud provider credentials in backend/.env"
echo "2. Run './scripts/start-dev.sh' to start the development servers"
echo "3. Open http://localhost:3000 in your browser"