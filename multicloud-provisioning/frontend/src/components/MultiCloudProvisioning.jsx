import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Server, 
  Settings, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader, 
  DollarSign,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const MultiCloudProvisioning = () => {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [credentials, setCredentials] = useState({
    aws: { accessKey: '', secretKey: '', region: 'us-east-1' },
    azure: { subscriptionId: '', clientId: '', clientSecret: '', tenantId: '' },
    gcp: { projectId: '', serviceAccountKey: '' }
  });
  const [architecture, setArchitecture] = useState({
    vmCount: 1,
    instanceType: 't3.micro',
    os: 'ubuntu-20.04',
    storage: 20,
    securityGroup: 'web'
  });
  const [costEstimate, setCostEstimate] = useState(null);
  const [deploymentId, setDeploymentId] = useState(null);
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [credentialsValid, setCredentialsValid] = useState(null);

  const cloudProviders = [
    { id: 'aws', name: 'Amazon Web Services', icon: '🚀', color: 'bg-orange-500' },
    { id: 'azure', name: 'Microsoft Azure', icon: '☁️', color: 'bg-blue-500' },
    { id: 'gcp', name: 'Google Cloud Platform', icon: '🌐', color: 'bg-green-500' }
  ];

  const instanceTypes = {
    aws: [
      { id: 't3.micro', name: 't3.micro (1 vCPU, 1GB RAM)', cost: 8.5 },
      { id: 't3.small', name: 't3.small (1 vCPU, 2GB RAM)', cost: 17 },
      { id: 't3.medium', name: 't3.medium (2 vCPU, 4GB RAM)', cost: 34 },
      { id: 't3.large', name: 't3.large (2 vCPU, 8GB RAM)', cost: 67 },
      { id: 'm5.large', name: 'm5.large (2 vCPU, 8GB RAM)', cost: 87 },
      { id: 'm5.xlarge', name: 'm5.xlarge (4 vCPU, 16GB RAM)', cost: 174 }
    ]
  };

  const osOptions = [
    { id: 'ubuntu-20.04', name: 'Ubuntu 20.04 LTS' },
    { id: 'ubuntu-22.04', name: 'Ubuntu 22.04 LTS' },
    { id: 'centos-7', name: 'CentOS 7' },
    { id: 'rhel-8', name: 'Red Hat Enterprise Linux 8' },
    { id: 'windows-2019', name: 'Windows Server 2019' },
    { id: 'windows-2022', name: 'Windows Server 2022' }
  ];

  const securityGroups = [
    { id: 'web', name: 'Web Server (HTTP, HTTPS, SSH)', ports: '80, 443, 22' },
    { id: 'ssh', name: 'SSH Only', ports: '22' },
    { id: 'default', name: 'Default (HTTP, SSH)', ports: '80, 22' }
  ];

  // Validate credentials
  const validateCredentials = async () => {
    try {
      const response = await fetch('/api/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          credentials: credentials[selectedProvider]
        })
      });
      const result = await response.json();
      setCredentialsValid(result.valid);
      return result.valid;
    } catch (error) {
      console.error('Credential validation error:', error);
      setCredentialsValid(false);
      return false;
    }
  };

  // Estimate cost
  const estimateCost = async () => {
    try {
      const response = await fetch('/api/estimate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider,
          architecture
        })
      });
      const result = await response.json();
      setCostEstimate(result);
    } catch (error) {
      console.error('Cost estimation error:', error);
    }
  };

  // Deploy infrastructure
  const deployInfrastructure = async () => {
    setIsDeploying(true);
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider,
          credentials,
          architecture
        })
      });
      
      const result = await response.json();
      if (result.deployment_id) {
        setDeploymentId(result.deployment_id);
        pollDeploymentStatus(result.deployment_id);
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setIsDeploying(false);
    }
  };

  // Poll deployment status
  const pollDeploymentStatus = async (id) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/deployment/${id}/status`);
        const status = await response.json();
        setDeploymentStatus(status);
        
        if (status.status === 'completed' || status.status === 'failed') {
          setIsDeploying(false);
        } else {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Status polling error:', error);
        setIsDeploying(false);
      }
    };
    poll();
  };

  // Auto-estimate cost when architecture changes
  useEffect(() => {
    if (selectedProvider && step >= 3) {
      estimateCost();
    }
  }, [architecture, selectedProvider]);

  const nextStep = async () => {
    if (step === 2 && selectedProvider) {
      const valid = await validateCredentials();
      if (!valid) return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Cloud className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Multi-Cloud VM Provisioning</h1>
          </div>
          <p className="text-gray-600 text-lg">Deploy virtual machines across AWS, Azure, and GCP with ease</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  step >= stepNum ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && <div className={`w-16 h-1 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Provider Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Cloud className="mr-3" />
                Select Cloud Provider
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {cloudProviders.map((provider) => (
                  <div
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedProvider === provider.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{provider.icon}</div>
                      <h3 className="text-lg font-semibold">{provider.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Credentials */}
          {step === 2 && selectedProvider && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Settings className="mr-3" />
                Configure Credentials
              </h2>
              
              {selectedProvider === 'aws' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">AWS Access Key ID</label>
                    <input
                      type="text"
                      value={credentials.aws.accessKey}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        aws: { ...credentials.aws, accessKey: e.target.value }
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="AKIA..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">AWS Secret Access Key</label>
                    <input
                      type="password"
                      value={credentials.aws.secretKey}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        aws: { ...credentials.aws, secretKey: e.target.value }
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">AWS Region</label>
                    <select
                      value={credentials.aws.region}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        aws: { ...credentials.aws, region: e.target.value }
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="us-east-1">US East (N. Virginia)</option>
                      <option value="us-east-2">US East (Ohio)</option>
                      <option value="us-west-1">US West (N. California)</option>
                      <option value="us-west-2">US West (Oregon)</option>
                      <option value="eu-west-1">Europe (Ireland)</option>
                      <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    </select>
                  </div>
                </div>
              )}

              {credentialsValid === false && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-700">Credentials validation failed. Please check your credentials.</span>
                </div>
              )}

              {credentialsValid === true && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-700">Credentials validated successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Architecture Configuration */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Server className="mr-3" />
                Configure Architecture
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of VMs</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={architecture.vmCount}
                      onChange={(e) => setArchitecture({
                        ...architecture,
                        vmCount: parseInt(e.target.value)
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Instance Type</label>
                    <select
                      value={architecture.instanceType}
                      onChange={(e) => setArchitecture({
                        ...architecture,
                        instanceType: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {instanceTypes[selectedProvider]?.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name} - ${type.cost}/month
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Operating System</label>
                    <select
                      value={architecture.os}
                      onChange={(e) => setArchitecture({
                        ...architecture,
                        os: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {osOptions.map((os) => (
                        <option key={os.id} value={os.id}>{os.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Storage (GB)</label>
                    <input
                      type="number"
                      min="20"
                      max="1000"
                      value={architecture.storage}
                      onChange={(e) => setArchitecture({
                        ...architecture,
                        storage: parseInt(e.target.value)
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Security Group</label>
                    <select
                      value={architecture.securityGroup}
                      onChange={(e) => setArchitecture({
                        ...architecture,
                        securityGroup: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {securityGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} - Ports: {group.ports}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cost Estimate */}
                  {costEstimate && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-semibold text-blue-800">Estimated Monthly Cost</h3>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 mb-2">
                        ${costEstimate.monthly_cost}/month
                      </div>
                      <div className="text-sm text-blue-700">
                        <div>Compute: ${costEstimate.breakdown.compute}</div>
                        <div>Storage: ${costEstimate.breakdown.storage}</div>
                        <div>Network: ${costEstimate.breakdown.network}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Deploy */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <Eye className="mr-3" />
                Review & Deploy
              </h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuration Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Provider:</strong> {cloudProviders.find(p => p.id === selectedProvider)?.name}</div>
                    <div><strong>VMs:</strong> {architecture.vmCount}</div>
                    <div><strong>Instance Type:</strong> {architecture.instanceType}</div>
                    <div><strong>OS:</strong> {osOptions.find(os => os.id === architecture.os)?.name}</div>
                    <div><strong>Storage:</strong> {architecture.storage} GB</div>
                    <div><strong>Security:</strong> {securityGroups.find(sg => sg.id === architecture.securityGroup)?.name}</div>
                  </div>
                </div>

                {costEstimate && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Cost Breakdown</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        ${costEstimate.monthly_cost}/month
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>Compute: ${costEstimate.breakdown.compute}</div>
                        <div>Storage: ${costEstimate.breakdown.storage}</div>
                        <div>Network: ${costEstimate.breakdown.network}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isDeploying && !deploymentStatus && (
                <button
                  onClick={deployInfrastructure}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Play className="mr-2" />
                  Deploy Infrastructure
                </button>
              )}

              {/* Deployment Status */}
              {(isDeploying || deploymentStatus) && (
                <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-4">
                    {deploymentStatus?.status === 'completed' ? (
                      <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    ) : deploymentStatus?.status === 'failed' ? (
                      <XCircle className="h-6 w-6 text-red-600 mr-2" />
                    ) : (
                      <Loader className="h-6 w-6 text-blue-600 mr-2 animate-spin" />
                    )}
                    <h3 className="text-lg font-semibold">Deployment Status</h3>
                  </div>

                  {deploymentStatus && (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{deploymentStatus.message}</span>
                          <span className="text-sm text-gray-500">{deploymentStatus.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${deploymentStatus.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {deploymentStatus.status === 'completed' && deploymentStatus.outputs && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h