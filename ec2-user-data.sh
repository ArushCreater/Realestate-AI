#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting NSW Property API setup..."

# Update system
yum update -y

# Install Python 3.11
amazon-linux-extras install python3.11 -y || yum install python3.11 python3.11-pip -y

# Install git
yum install git -y

# Clone repo (backend branch)
cd /home/ec2-user
git clone -b python-backend-deploy https://github.com/ArushCreater/Realestate-AI.git app
cd app

# Install dependencies
pip3.11 install -r requirements.txt

# Create systemd service
cat > /etc/systemd/system/nsw-property-api.service <<EOF
[Unit]
Description=NSW Property API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/app
Environment="PARQUET_FILE_URL=https://github.com/ArushCreater/Realestate-AI/releases/download/v1.0.0/property_data.parquet"
ExecStart=/usr/bin/python3.11 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R ec2-user:ec2-user /home/ec2-user/app

# Start service
systemctl daemon-reload
systemctl enable nsw-property-api
systemctl start nsw-property-api

echo "Setup complete! API should be running on port 8000"
echo "Check status with: systemctl status nsw-property-api"
echo "Check logs with: journalctl -u nsw-property-api -f"

