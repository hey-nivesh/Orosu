#!/usr/bin/env bash
set -e

echo "=================================================="
echo "🚀 Setting up Hermes Agent Server on Oracle Linux/Ubuntu VPS"
echo "=================================================="

# 1. Install prerequisites
if command -v apt-get &> /dev/null; then
    sudo apt-get update -y
    sudo apt-get install -y python3 python3-pip git curl ufw
elif command -v dnf &> /dev/null; then
    sudo dnf update -y
    sudo dnf install -y python3 python3-pip git curl firewalld
fi

# 2. Open port 8000 for incoming Render API requests
if command -v ufw &> /dev/null; then
    sudo ufw allow 8000/tcp || true
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=8000/tcp || true
    sudo firewall-cmd --reload || true
fi

# 3. Create app directory
HERMES_DIR="/opt/hermes-server"
sudo mkdir -p "$HERMES_DIR"
sudo cp hermes_server.py "$HERMES_DIR/"
sudo cp hermes.service /etc/systemd/system/ || true

# 4. Set permissions
sudo chown -R $USER:$USER "$HERMES_DIR"

# 5. Reload systemd and start service
sudo systemctl daemon-reload
sudo systemctl enable hermes
sudo systemctl restart hermes

echo "=================================================="
echo "✅ Hermes Service started successfully on port 8000!"
echo "Check status: sudo systemctl status hermes"
echo "View logs:    journalctl -u hermes -f"
echo "=================================================="
