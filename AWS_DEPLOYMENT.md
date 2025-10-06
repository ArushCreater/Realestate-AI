# AWS Deployment Guide for NSW Property API

## Option 1: AWS App Runner (Recommended - Easiest)

### Prerequisites:
- AWS Account
- AWS CLI configured (`aws configure`)
- Docker installed locally (for testing)

### Steps:

**1. Test Docker locally (optional):**
```bash
docker build -t nsw-property-api .
docker run -p 8000:8000 -e PARQUET_FILE_URL="https://github.com/ArushCreater/Realestate-AI/releases/download/v1.0.0/property_data.parquet" nsw-property-api
```

**2. Create ECR Repository:**
```bash
aws ecr create-repository --repository-name nsw-property-api --region us-east-1
```

**3. Build and Push to ECR:**
```bash
# Get login credentials
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build for AMD64 (AWS architecture)
docker buildx build --platform linux/amd64 -t nsw-property-api .

# Tag the image
docker tag nsw-property-api:latest <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nsw-property-api:latest

# Push to ECR
docker push <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nsw-property-api:latest
```

**4. Create App Runner Service (AWS Console):**
1. Go to: https://console.aws.amazon.com/apprunner
2. Click **"Create service"**
3. **Source**: Container registry → Amazon ECR
4. **Image**: Select your image (`nsw-property-api:latest`)
5. **Deployment trigger**: Manual (or Automatic for CI/CD)
6. **Service settings**:
   - **Service name**: `nsw-property-api`
   - **Port**: `8000`
   - **CPU**: 1 vCPU
   - **Memory**: 2 GB
7. **Environment variables**:
   - Add: `PARQUET_FILE_URL` = `https://github.com/ArushCreater/Realestate-AI/releases/download/v1.0.0/property_data.parquet`
8. **Health check**: `/` (default endpoint)
9. Click **"Create & deploy"**

**5. Get Your URL:**
- App Runner will provide a URL like: `https://abc123.us-east-1.awsapprunner.com`
- Use this as your `PYTHON_API_URL` in Vercel

**Cost:** ~$15-20/month for 2GB RAM with App Runner

---

## Option 2: EC2 (Free Tier - t2.micro 1GB RAM)

### Launch EC2 Instance:

**1. Launch Instance:**
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxx \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nsw-property-api}]'
```

**2. Create `user-data.sh`:**
```bash
#!/bin/bash
set -e

# Update system
yum update -y

# Install Python 3.11
yum install python3.11 python3.11-pip -y

# Install git
yum install git -y

# Clone repo (backend branch)
cd /home/ec2-user
git clone -b python-backend-deploy https://github.com/ArushCreater/Realestate-AI.git app
cd app

# Install dependencies
pip3.11 install -r requirements.txt

# Set environment variable
export PARQUET_FILE_URL="https://github.com/ArushCreater/Realestate-AI/releases/download/v1.0.0/property_data.parquet"

# Run the app
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > /var/log/app.log 2>&1 &

echo "App started! Check logs at /var/log/app.log"
```

**3. Configure Security Group:**
```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 8000 \
  --cidr 0.0.0.0/0
```

**4. Get Public IP:**
```bash
aws ec2 describe-instances --instance-ids i-xxxxx --query 'Reservations[0].Instances[0].PublicIpAddress'
```

**5. SSH and check logs:**
```bash
ssh -i your-key.pem ec2-user@<PUBLIC_IP>
tail -f /var/log/app.log
```

Your API will be at: `http://<PUBLIC_IP>:8000`

**Cost:** FREE for first 12 months (t2.micro), then ~$8/month

---

## Option 3: ECS Fargate (Production-grade)

### Quick Setup:

**1. Create ECS Cluster:**
```bash
aws ecs create-cluster --cluster-name nsw-property-cluster
```

**2. Register Task Definition:**
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

**3. Create `task-definition.json`:**
```json
{
  "family": "nsw-property-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/nsw-property-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "PARQUET_FILE_URL",
          "value": "https://github.com/ArushCreater/Realestate-AI/releases/download/v1.0.0/property_data.parquet"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nsw-property-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**4. Create Service with ALB:**
```bash
aws ecs create-service \
  --cluster nsw-property-cluster \
  --service-name nsw-property-service \
  --task-definition nsw-property-api \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

**Cost:** ~$15-25/month (1 task, 2GB RAM)

---

## Option 4: Lambda + API Gateway (Serverless - Advanced)

**Challenges:**
- Lambda has 10GB max memory
- 15-minute timeout might be tight for first cold start (downloading 63MB file)
- Need to use EFS for persistent Parquet file storage

**Good for:** Sporadic usage, but not ideal for continuous property queries

---

## Cost Comparison:

| Service | RAM | CPU | Cost/Month | Free Tier |
|---------|-----|-----|------------|-----------|
| **EC2 t2.micro** | 1GB | 1 vCPU | **FREE** (12mo) → $8 | ✅ Yes |
| **EC2 t3.small** | 2GB | 2 vCPU | $15 | ❌ No |
| **App Runner** | 2GB | 1 vCPU | $15-20 | ❌ No |
| **ECS Fargate** | 2GB | 1 vCPU | $20-25 | ❌ No |
| **Lambda** | 10GB | N/A | $10-15 | ✅ Some |

---

## My Recommendation:

**For Free:** EC2 t2.micro (1GB) - should work since you made the repo public (file downloads quickly)
**For Production:** App Runner or ECS Fargate (2GB) - more reliable, auto-scaling

---

## Quick Commands Cheat Sheet:

```bash
# Check EC2 instance
aws ec2 describe-instances --filters "Name=tag:Name,Values=nsw-property-api"

# View logs (if using CloudWatch)
aws logs tail /aws/apprunner/nsw-property-api --follow

# Update App Runner service
aws apprunner update-service --service-arn <ARN>

# SSH to EC2
ssh -i your-key.pem ec2-user@<PUBLIC_IP>

# Check app status on EC2
curl http://localhost:8000
```

---

Let me know which option you want to go with and I can provide more specific commands!

