from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import uuid
import subprocess
import threading
import time
from datetime import datetime
import shutil
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuration
TERRAFORM_DIR = "terraform_deployments"
DEPLOYMENT_STATUS = {}

# Ensure terraform directory exists
os.makedirs(TERRAFORM_DIR, exist_ok=True)

class TerraformManager:
    def __init__(self, deployment_id):
        self.deployment_id = deployment_id
        self.deployment_dir = os.path.join(TERRAFORM_DIR, deployment_id)
        os.makedirs(self.deployment_dir, exist_ok=True)
    
    def generate_aws_terraform(self, config):
        """Generate Terraform configuration for AWS"""
        terraform_config = f"""
terraform {{
  required_providers {{
    aws = {{
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }}
  }}
}}

provider "aws" {{
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  region     = var.aws_region
}}

variable "aws_access_key" {{
  description = "AWS Access Key"
  type        = string
  sensitive   = true
}}

variable "aws_secret_key" {{
  description = "AWS Secret Key"
  type        = string
  sensitive   = true
}}

variable "aws_region" {{
  description = "AWS Region"
  type        = string
  default     = "{config['credentials']['region']}"
}}

variable "vm_count" {{
  description = "Number of VMs to create"
  type        = number
  default     = {config['architecture']['vmCount']}
}}

variable "instance_type" {{
  description = "EC2 instance type"
  type        = string
  default     = "{config['architecture']['instanceType']}"
}}

variable "storage_size" {{
  description = "Storage size in GB"
  type        = number
  default     = {config['architecture']['storage']}
}}

# Data sources
data "aws_ami" "selected" {{
  most_recent = true
  owners      = ["099720109477"] # Canonical for Ubuntu
  
  filter {{
    name   = "name"
    values = ["{self._get_ami_name(config['architecture']['os'])}"]
  }}
  
  filter {{
    name   = "virtualization-type"
    values = ["hvm"]
  }}
}}

# Security Group
resource "aws_security_group" "vm_sg" {{
  name_prefix = "multicloud-vm-"
  description = "Security group for multi-cloud VMs"
  
  {self._get_aws_security_rules(config['architecture']['securityGroup'])}
  
  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}
  
  tags = {{
    Name = "MultiCloud-VM-SG"
    Environment = "Production"
    ManagedBy = "MultiCloudProvisioning"
  }}
}}

# Key Pair
resource "aws_key_pair" "vm_key" {{
  key_name   = "multicloud-key-${{random_string.deployment_id.result}}"
  public_key = tls_private_key.vm_key.public_key_openssh
}}

resource "tls_private_key" "vm_key" {{
  algorithm = "RSA"
  rsa_bits  = 4096
}}

resource "random_string" "deployment_id" {{
  length  = 8
  special = false
  upper   = false
}}

# EC2 Instances
resource "aws_instance" "vm" {{
  count         = var.vm_count
  ami           = data.aws_ami.selected.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.vm_key.key_name
  
  vpc_security_group_ids = [aws_security_group.vm_sg.id]
  
  root_block_device {{
    volume_type = "gp3"
    volume_size = var.storage_size
    encrypted   = true
  }}
  
  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y nginx htop curl
    systemctl start nginx
    systemctl enable nginx
    echo "<h1>MultiCloud VM Instance ${{count.index + 1}}</h1>" > /var/www/html/index.html
    echo "<p>Deployed via MultiCloud Provisioning System</p>" >> /var/www/html/index.html
    echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
  EOF
  
  tags = {{
    Name = "MultiCloud-VM-${{count.index + 1}}"
    Environment = "Production"
    ManagedBy = "MultiCloudProvisioning"
    DeploymentId = "${{random_string.deployment_id.result}}"
  }}
}}

# Outputs
output "instance_ids" {{
  description = "IDs of the EC2 instances"
  value       = aws_instance.vm[*].id
}}

output "public_ips" {{
  description = "Public IP addresses of the instances"
  value       = aws_instance.vm[*].public_ip
}}

output "private_ips" {{
  description = "Private IP addresses of the instances"
  value       = aws_instance.vm[*].private_ip
}}

output "instance_dns" {{
  description = "Public DNS names of the instances"
  value       = aws_instance.vm[*].public_dns
}}

output "private_key" {{
  description = "Private key for SSH access"
  value       = tls_private_key.vm_key.private_key_pem
  sensitive   = true
}}

output "deployment_summary" {{
  description = "Deployment summary"
  value = {{
    deployment_id = random_string.deployment_id.result
    instance_count = var.vm_count
    instance_type = var.instance_type
    region = var.aws_region
    created_at = timestamp()
  }}
}}
"""
        return terraform_config
    
    def _get_ami_name(self, os_type):
        """Get AMI name pattern for different OS types"""
        ami_patterns = {
            'ubuntu-20.04': 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*',
            'ubuntu-22.04': 'ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*',
            'centos-7': 'CentOS Linux 7 x86_64 HVM EBS*',
            'rhel-8': 'RHEL-8*x86_64*',
            'windows-2019': 'Windows_Server-2019-English-Full-Base-*',
            'windows-2022': 'Windows_Server-2022-English-Full-Base-*'
        }
        return ami_patterns.get(os_type, ami_patterns['ubuntu-20.04'])
    
    def _get_aws_security_rules(self, security_group):
        """Generate AWS security group rules"""
        if security_group == 'web':
            return '''
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }'''
        elif security_group == 'ssh':
            return '''
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }'''
        else:  # default
            return '''
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }'''
    
    def create_terraform_vars(self, config):
        """Create terraform.tfvars file"""
        provider = config['selectedProvider']
        vars_content = ""
        
        if provider == 'aws':
            vars_content = f"""
aws_access_key = "{config['credentials']['aws']['accessKey']}"
aws_secret_key = "{config['credentials']['aws']['secretKey']}"
aws_region = "{config['credentials']['aws']['region']}"
vm_count = {config['architecture']['vmCount']}
instance_type = "{config['architecture']['instanceType']}"
storage_size = {config['architecture']['storage']}
"""
        
        with open(os.path.join(self.deployment_dir, "terraform.tfvars"), 'w') as f:
            f.write(vars_content)
    
    def generate_terraform_config(self, config):
        """Generate appropriate Terraform configuration based on provider"""
        provider = config['selectedProvider']
        
        if provider == 'aws':
            terraform_config = self.generate_aws_terraform(config)
        else:
            raise ValueError(f"Unsupported provider: {provider}")
        
        # Write main.tf
        with open(os.path.join(self.deployment_dir, "main.tf"), 'w') as f:
            f.write(terraform_config)
        
        # Create terraform.tfvars
        self.create_terraform_vars(config)
        
        return terraform_config
    
    def run_terraform_command(self, command):
        """Execute terraform command and return result"""
        try:
            result = subprocess.run(
                command,
                cwd=self.deployment_dir,
                capture_output=True,
                text=True,
                timeout=600  # 10 minutes timeout
            )
            return {
                'success': result.returncode == 0,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'stdout': '',
                'stderr': 'Command timed out',
                'returncode': -1
            }
    
    def deploy(self):
        """Execute terraform deployment"""
        # Initialize terraform
        init_result = self.run_terraform_command(['terraform', 'init'])
        if not init_result['success']:
            return {'success': False, 'error': 'Terraform init failed', 'details': init_result}
        
        # Plan terraform
        plan_result = self.run_terraform_command(['terraform', 'plan'])
        if not plan_result['success']:
            return {'success': False, 'error': 'Terraform plan failed', 'details': plan_result}
        
        # Apply terraform
        apply_result = self.run_terraform_command(['terraform', 'apply', '-auto-approve'])
        if not apply_result['success']:
            return {'success': False, 'error': 'Terraform apply failed', 'details': apply_result}
        
        # Get outputs
        output_result = self.run_terraform_command(['terraform', 'output', '-json'])
        if output_result['success']:
            try:
                outputs = json.loads(output_result['stdout'])
                return {'success': True, 'outputs': outputs}
            except json.JSONDecodeError:
                return {'success': True, 'outputs': {}}
        
        return {'success': True, 'outputs': {}}

def deploy_infrastructure_async(deployment_id, config):
    """Asynchronous deployment function"""
    try:
        DEPLOYMENT_STATUS[deployment_id] = {
            'status': 'initializing',
            'progress': 0,
            'message': 'Initializing deployment...',
            'start_time': datetime.now().isoformat()
        }
        
        # Create terraform manager
        terraform_manager = TerraformManager(deployment_id)
        
        # Update status
        DEPLOYMENT_STATUS[deployment_id].update({
            'status': 'generating',
            'progress': 20,
            'message': 'Generating Terraform configuration...'
        })
        
        # Generate terraform configuration
        terraform_manager.generate_terraform_config(config)
        
        # Update status
        DEPLOYMENT_STATUS[deployment_id].update({
            'status': 'deploying',
            'progress': 40,
            'message': 'Deploying infrastructure...'
        })
        
        # Deploy infrastructure
        result = terraform_manager.deploy()
        
        if result['success']:
            DEPLOYMENT_STATUS[deployment_id].update({
                'status': 'completed',
                'progress': 100,
                'message': 'Deployment completed successfully!',
                'outputs': result.get('outputs', {}),
                'end_time': datetime.now().isoformat()
            })
        else:
            DEPLOYMENT_STATUS[deployment_id].update({
                'status': 'failed',
                'progress': 0,
                'message': f"Deployment failed: {result.get('error', 'Unknown error')}",
                'error_details': result.get('details', {}),
                'end_time': datetime.now().isoformat()
            })
    
    except Exception as e:
        DEPLOYMENT_STATUS[deployment_id].update({
            'status': 'failed',
            'progress': 0,
            'message': f'Deployment failed: {str(e)}',
            'end_time': datetime.now().isoformat()
        })

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/validate-credentials', methods=['POST'])
def validate_credentials():
    """Validate cloud provider credentials"""
    try:
        data = request.json
        provider = data.get('provider')
        credentials = data.get('credentials', {})
        
        # Basic validation logic
        if provider == 'aws':
            required_fields = ['accessKey', 'secretKey', 'region']
            if all(credentials.get(field) for field in required_fields):
                return jsonify({'valid': True, 'message': 'AWS credentials validated'})
        
        return jsonify({'valid': False, 'message': 'Missing required credentials'})
    
    except Exception as e:
        return jsonify({'valid': False, 'message': f'Validation error: {str(e)}'}), 500

@app.route('/api/estimate-cost', methods=['POST'])
def estimate_cost():
    """Estimate deployment cost"""
    try:
        data = request.json
        provider = data.get('selectedProvider')
        architecture = data.get('architecture', {})
        
        # Simplified cost estimation
        base_costs = {
            'aws': {'t3.micro': 8.5, 't3.small': 17, 't3.medium': 34, 't3.large': 67, 'm5.large': 87, 'm5.xlarge': 174}
        }
        
        instance_type = architecture.get('instanceType', '')
        vm_count = architecture.get('vmCount', 1)
        storage = architecture.get('storage', 20)
        
        base_cost = base_costs.get(provider, {}).get(instance_type, 50)
        storage_cost = storage * 0.1
        total_monthly = (base_cost + storage_cost) * vm_count
        
        return jsonify({
            'monthly_cost': round(total_monthly, 2),
            'breakdown': {
                'compute': round(base_cost * vm_count, 2),
                'storage': round(storage_cost * vm_count, 2),
                'network': 5.0
            }
        })
    
    except Exception as e:
        return jsonify({'error': f'Cost estimation failed: {str(e)}'}), 500

@app.route('/api/deploy', methods=['POST'])
def deploy_infrastructure():
    """Deploy infrastructure"""
    try:
        config = request.json
        deployment_id = str(uuid.uuid4())
        
        # Start async deployment
        thread = threading.Thread(
            target=deploy_infrastructure_async,
            args=(deployment_id, config)
        )
        thread.start()
        
        return jsonify({
            'deployment_id': deployment_id,
            'status': 'initiated',
            'message': 'Deployment started successfully'
        })
    
    except Exception as e:
        return jsonify({'error': f'Deployment initiation failed: {str(e)}'}), 500

@app.route('/api/deployment/<deployment_id>/status', methods=['GET'])
def get_deployment_status(deployment_id):
    """Get deployment status"""
    if deployment_id not in DEPLOYMENT_STATUS:
        return jsonify({'error': 'Deployment not found'}), 404
    
    return jsonify(DEPLOYMENT_STATUS[deployment_id])

@app.route('/api/deployments', methods=['GET'])
def list_deployments():
    """List all deployments"""
    deployments = []
    for deployment_id, status in DEPLOYMENT_STATUS.items():
        deployments.append({
            'deployment_id': deployment_id,
            'status': status['status'],
            'progress': status['progress'],
            'message': status['message'],
            'start_time': status.get('start_time'),
            'end_time': status.get('end_time')
        })
    
    return jsonify({'deployments': deployments})

if __name__ == '__main__':
    print("🚀 Multi-Cloud Provisioning Backend Starting...")
    print("🌐 Server running on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)