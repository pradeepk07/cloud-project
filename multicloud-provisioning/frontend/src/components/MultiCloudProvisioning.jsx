import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Server, 
  Settings, 
  DollarSign, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  RefreshCw,
  Shield,
  HardDrive,
  Cpu,
  Globe,
  AlertTriangle,
  Info
} from 'lucide-react';

const MultiCloudProvisioning = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [credentials, setCredentials] = useState({
    aws: { accessKey: '', secretKey: '', region: 'us-east-1' },
    azure: { subscriptionId: '', clientId: '', clientSecret: '', tenantId: '' },
    gcp: { projectId: '', keyFile: null }
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
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validatingCredentials, setValidatingCredentials] = useState(false);
  const [credentialsValid, setCredentialsValid] = useState(false);

  const steps = [
    { title: 'Cloud Provider', icon: Cloud },
    { title: 'Credentials', icon: Shield },
    { title: 'Architecture', icon: Server },
    { title: 'Review & Deploy', icon: Play }
  ];

  const providers = [
    { 
      id: 'aws', 
      name: 'Amazon Web Services', 
      logo: '🟠',
      description: 'Industry-leading cloud platform with global infrastructure'
    },
    { 
      id: 'azure', 
      name: 'Microsoft Azure', 
      logo: '🔵',
      description: 'Enterprise-grade cloud services with hybrid capabilities'
    },
    { 
      id: 'gcp', 
      name: 'Google Cloud Platform', 
      logo: '🟡',
      description: 'Data and AI-focused cloud platform with advanced analytics'
    }
  ];

  const instanceTypes = {
    aws: [
      { value: 't3.micro', label: 't3.micro (1 vCPU, 1GB RAM)', price: 8.5 },
      { value: 't3.small', label: 't3.small (1 vCPU, 2GB RAM)', price: 17 },
      { value: 't3.medium', label: 't3.medium (2 vCPU, 4GB RAM)', price: 34 },
      { value: 't3.large', label: 't3.large (2 vCPU, 8GB RAM)', price: 67 },
      { value: 'm5.large', label: 'm5.large (2 vCPU, 8GB RAM)', price: 87 },
      { value: 'm5.xlarge', label: 'm5.xlarge (4 vCPU, 16GB RAM)', price: 174 }
    ],
    azure: [
      { value: 'Standard_B1s', label: 'Standard_B1s (1 vCPU, 1GB RAM)', price: 7.5 },
      { value: 'Standard_B2s', label: 'Standard_B2s (2 vCPU, 4GB RAM)', price: 30 },
      { value: 'Standard_D2s_v3', label: 'Standard_D2s_v3 (2 vCPU, 8GB RAM)', price: 70 }
    ],
    gcp: [
      { value: 'e2-micro', label: 'e2-micro (1 vCPU, 1GB RAM)', price: 6.8 },
      { value: 'e2-small', label: 'e2-small (1 vCPU, 2GB RAM)', price: 13.6 },
      { value: 'e2-medium', label: 'e2-medium (1 vCPU, 4GB RAM)', price: 27.2 }
    ]
  };

  const operatingSystems = [
    { value: 'ubuntu-20.04', label: 'Ubuntu 20.04 LTS' },
    { value: 'ubuntu-22.04', label: 'Ubuntu 22.04 LTS' },
    { value: 'centos-7', label: 'CentOS 7' },
    { value: 'rhel-8', label: 'Red Hat Enterprise Linux 8' },
    { value: 'windows-2019', label: 'Windows Server 2019' },
    { value: 'windows-2022', label: 'Windows Server 2022' }
  ];

  const securityGroups = [
    { value: 'web', label: 'Web Server (HTTP, HTTPS, SSH)', ports: '80, 443, 22' },
    { value: 'ssh', label: 'SSH Only', ports: '22' },
    { value: 'default', label: 'Default (HTTP, SSH)', ports: '80, 22' }
  ];

  // Simulate API calls
  const apiCall = async (endpoint, options = {}) => {
    // Mock API responses for demonstration
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    if (endpoint === '/api/validate-credentials') {
      return { valid: true, message: 'Credentials validated successfully' };
    }
    
    if (endpoint === '/api/estimate-cost') {
      const basePrice = instanceTypes[selectedProvider]?.find(t => t.value === architecture.instanceType)?.price || 50;
      const storagePrice = architecture.storage * 0.1;
      const totalMonthly = (basePrice + storagePrice) * architecture.vmCount;
      
      return {
        monthly_cost: Math.round(totalMonthly * 100) / 100,
        breakdown: {
          compute: Math.round(basePrice * architecture.vmCount * 100) / 100,
          storage: Math.round(storagePrice * architecture.vmCount * 100) / 100,
          network: 5.0
        }
      };
    }
    
    if (endpoint === '/api/deploy') {
      const newDeploymentId = 'deploy-' + Math.random().toString(36).substr(2, 9);
      return {
        deployment_id: newDeploymentId,
        status: 'initiated',
        message: 'Deployment started successfully'
      };
    }
    
    if (endpoint.includes('/api/deployment/') && endpoint.includes('/status')) {
      // Simulate deployment progress based on time
      const deploymentStartTime = Date.now() - 30000; // Started 30 seconds ago
      const elapsed = Date.now() - deploymentStartTime;
      
      if (elapsed < 10000) {
        return {
          status: 'initializing',
          progress: 10,
          message: 'Initializing deployment...',
          start_time: new Date(deploymentStartTime).toISOString()
        };
      } else if (elapsed < 20000) {
        return {
          status: 'generating',
          progress: 40,
          message: 'Generating Terraform configuration...',
          start_time: new Date(deploymentStartTime).toISOString()
        };
      } else if (elapsed < 30000) {
        return {
          status: 'deploying',
          progress: 70,
          message: 'Deploying infrastructure...',
          start_time: new Date(deploymentStartTime).toISOString()
        };
      } else {
        return {
          status: 'completed',
          progress: 100,
          message: 'Deployment completed successfully!',
          outputs: {
            instance_ids: { value: ['i-1234567890abcdef0', 'i-0987654321fedcba0'] },
            public_ips: { value: ['54.123.45.67', '54.123.45.68'] },
            private_ips: { value: ['10.0.1.10', '10.0.1.11'] }
          },
          start_time: new Date(deploymentStartTime).toISOString(),
          end_time: new Date().toISOString()
        };
      }
    }
    
    return {};
  };

  const validateCredentials = async () => {
    if (!selectedProvider) return;
    
    setValidatingCredentials(true);
    try {
      const response = await apiCall('/api/validate-credentials', {
        method: 'POST',
        body: JSON.stringify({
          provider: selectedProvider,
          credentials: credentials[selectedProvider]
        })
      });
      
      setCredentialsValid(response.valid);
    } catch (error) {
      setCredentialsValid(false);
    } finally {
      setValidatingCredentials(false);
    }
  };

  const estimateCost = async () => {
    if (!selectedProvider || !architecture.instanceType) return;
    
    setLoading(true);
    try {
      const response = await apiCall('/api/estimate-cost', {
        method: 'POST',
        body: JSON.stringify({
          selectedProvider,
          architecture
        })
      });
      
      setCostEstimate(response);
    } catch (error) {
      console.error('Cost estimation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const deployInfrastructure = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/api/deploy', {
        method: 'POST',
        body: JSON.stringify({
          selectedProvider,
          credentials,
          architecture
        })
      });
      
      setDeploymentId(response.deployment_id);
      setCurrentStep(4); // Move to monitoring step
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDeploymentStatus = async () => {
    if (!deploymentId) return;
    
    try {
      const response = await apiCall(`/api/deployment/${deploymentId}/status`);
      setDeploymentStatus(response);
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && selectedProvider && architecture.instanceType) {
      estimateCost();
    }
  }, [architecture.vmCount, architecture.instanceType, architecture.storage, selectedProvider, currentStep]);

  useEffect(() => {
    if (deploymentId && currentStep === 4) {
      let intervalId;
      
      const pollStatus = async () => {
        const shouldStop = await checkDeploymentStatus();
        if (shouldStop) {
          clearInterval(intervalId);
        }
      };
      
      // Initial check
      pollStatus();
      
      // Set up polling
      intervalId = setInterval(pollStatus, 3000);
      
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [deploymentId, currentStep]);

  const renderProviderSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Cloud Provider</h2>
        <p className="text-gray-600">Select the cloud platform for your VM deployment</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <div
            key={provider.id}
            onClick={() => setSelectedProvider(provider.id)}
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedProvider === provider.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{provider.logo}</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{provider.name}</h3>
              <p className="text-sm text-gray-600">{provider.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCredentialsForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cloud Credentials</h2>
        <p className="text-gray-600">Configure your {providers.find(p => p.id === selectedProvider)?.name} credentials</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {selectedProvider === 'aws' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Access Key ID</label>
              <input
                type="text"
                value={credentials.aws.accessKey}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  aws: { ...prev.aws, accessKey: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="AKIAIOSFODNN7EXAMPLE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secret Access Key</label>
              <input
                type="password"
                value={credentials.aws.secretKey}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  aws: { ...prev.aws, secretKey: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
              <select
                value={credentials.aws.region}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  aws: { ...prev.aws, region: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="us-east-1">US East (N. Virginia)</option>
                <option value="us-west-2">US West (Oregon)</option>
                <option value="eu-west-1">Europe (Ireland)</option>
                <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
              </select>
            </div>
          </div>
        )}

        {selectedProvider === 'azure' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subscription ID</label>
              <input
                type="text"
                value={credentials.azure.subscriptionId}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  azure: { ...prev.azure, subscriptionId: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678-1234-1234-1234-123456789012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
              <input
                type="text"
                value={credentials.azure.clientId}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  azure: { ...prev.azure, clientId: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678-1234-1234-1234-123456789012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
              <input
                type="password"
                value={credentials.azure.clientSecret}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  azure: { ...prev.azure, clientSecret: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your client secret"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tenant ID</label>
              <input
                type="text"
                value={credentials.azure.tenantId}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  azure: { ...prev.azure, tenantId: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345678-1234-1234-1234-123456789012"
              />
            </div>
          </div>
        )}

        {selectedProvider === 'gcp' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project ID</label>
              <input
                type="text"
                value={credentials.gcp.projectId}
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  gcp: { ...prev.gcp, projectId: e.target.value }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="my-project-123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Account Key</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setCredentials(prev => ({
                  ...prev,
                  gcp: { ...prev.gcp, keyFile: e.target.files[0] }
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">Upload your service account JSON key file</p>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={validateCredentials}
            disabled={validatingCredentials}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {validatingCredentials ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Shield className="w-4 h-4 mr-2" />
            )}
            {validatingCredentials ? 'Validating...' : 'Validate Credentials'}
          </button>
        </div>

        {credentialsValid && (
          <div className="flex items-center justify-center mt-4 text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Credentials validated successfully!</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderArchitectureForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Architecture</h2>
        <p className="text-gray-600">Define your virtual machine specifications</p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Cpu className="w-4 h-4 inline mr-1" />
              Number of VMs
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={architecture.vmCount}
              onChange={(e) => setArchitecture(prev => ({
                ...prev,
                vmCount: parseInt(e.target.value) || 1
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Server className="w-4 h-4 inline mr-1" />
              Instance Type
            </label>
            <select
              value={architecture.instanceType}
              onChange={(e) => setArchitecture(prev => ({
                ...prev,
                instanceType: e.target.value
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {instanceTypes[selectedProvider]?.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - ${type.price}/month
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Operating System
            </label>
            <select
              value={architecture.os}
              onChange={(e) => setArchitecture(prev => ({
                ...prev,
                os: e.target.value
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {operatingSystems.map((os) => (
                <option key={os.value} value={os.value}>
                  {os.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <HardDrive className="w-4 h-4 inline mr-1" />
              Storage Size (GB)
            </label>
            <input
              type="number"
              min="20"
              max="1000"
              value={architecture.storage}
              onChange={(e) => setArchitecture(prev => ({
                ...prev,
                storage: parseInt(e.target.value) || 20
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Security Group
            </label>
            <select
              value={architecture.securityGroup}
              onChange={(e) => setArchitecture(prev => ({
                ...prev,
                securityGroup: e.target.value
              }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {securityGroups.map((sg) => (
                <option key={sg.value} value={sg.value}>
                  {sg.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Opens ports: {securityGroups.find(sg => sg.value === architecture.securityGroup)?.ports}
            </p>
          </div>

          {costEstimate && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Cost Estimation
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Compute:</span>
                  <span>${costEstimate.breakdown.compute}/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span>${costEstimate.breakdown.storage}/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Network:</span>
                  <span>${costEstimate.breakdown.network}/month</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${costEstimate.monthly_cost}/month</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReviewAndDeploy = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Deploy</h2>
        <p className="text-gray-600">Confirm your configuration and start the deployment</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Cloud className="w-5 h-5 mr-2" />
                Cloud Provider
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Provider:</span>
                  <span className="font-medium">{providers.find(p => p.id === selectedProvider)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Region:</span>
                  <span className="font-medium">{credentials[selectedProvider]?.region || 'Default'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Architecture
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>VM Count:</span>
                  <span className="font-medium">{architecture.vmCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Instance Type:</span>
                  <span className="font-medium">{architecture.instanceType}</span>
                </div>
                <div className="flex justify-between">
                  <span>OS:</span>
                  <span className="font-medium">{operatingSystems.find(os => os.value === architecture.os)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-medium">{architecture.storage} GB</span>
                </div>
              </div>
            </div>
          </div>

          {costEstimate && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Monthly Cost Estimate
              </h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 text-center">
                  ${costEstimate.monthly_cost}/month
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-6 text-center">
            <button
              onClick={deployInfrastructure}
              disabled={loading || !credentialsValid}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Starting Deployment...' : 'Deploy Infrastructure'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeploymentMonitor = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deployment Monitor</h2>
        <p className="text-gray-600">Track your infrastructure deployment progress</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {deploymentStatus && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Deployment: {deploymentId}</h3>
                <p className="text-gray-600">{deploymentStatus.message}</p>
              </div>
              <div className="flex items-center">
                {deploymentStatus.status === 'completed' && (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                )}
                {deploymentStatus.status === 'failed' && (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
                {!['completed', 'failed'].includes(deploymentStatus.status) && (
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                )}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  deploymentStatus.status === 'completed' ? 'bg-green-500' :
                  deploymentStatus.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${deploymentStatus.progress}%` }}
              ></div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Status Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium capitalize ${
                      deploymentStatus.status === 'completed' ? 'text-green-600' :
                      deploymentStatus.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {deploymentStatus.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className="font-medium">{deploymentStatus.progress}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span className="font-medium">
                      {deploymentStatus.start_time ? new Date(deploymentStatus.start_time).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  {deploymentStatus.end_time && (
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-medium">
                        {new Date(deploymentStatus.end_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {deploymentStatus.outputs && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Deployment Outputs</h4>
                  <div className="space-y-2 text-sm">
                    {deploymentStatus.outputs.instance_ids && (
                      <div>
                        <span className="font-medium">Instance IDs:</span>
                        <div className="mt-1 space-y-1">
                          {deploymentStatus.outputs.instance_ids.value.map((id, index) => (
                            <div key={index} className="text-xs bg-gray-100 p-2 rounded font-mono">
                              {id}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {deploymentStatus.outputs.public_ips && (
                      <div>
                        <span className="font-medium">Public IPs:</span>
                        <div className="mt-1 space-y-1">
                          {deploymentStatus.outputs.public_ips.value.map((ip, index) => (
                            <div key={index} className="text-xs bg-gray-100 p-2 rounded font-mono">
                              {ip}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {deploymentStatus.status === 'completed' && (
              <div className="border-t pt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <h4 className="font-semibold text-green-800">Deployment Successful!</h4>
                  </div>
                  <p className="text-green-700 mt-2">
                    Your infrastructure has been deployed successfully. You can now access your VMs using the provided IP addresses.
                  </p>
                  <div className="mt-4 flex space-x-3">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Download SSH Keys
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      View Resources
                    </button>
                  </div>
                </div>
              </div>
            )}

            {deploymentStatus.status === 'failed' && (
              <div className="border-t pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                    <h4 className="font-semibold text-red-800">Deployment Failed</h4>
                  </div>
                  <p className="text-red-700 mt-2">
                    There was an issue with your deployment. Please check your credentials and configuration.
                  </p>
                  <div className="mt-4">
                    <button 
                      onClick={() => {
                        setCurrentStep(0);
                        setDeploymentId(null);
                        setDeploymentStatus(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderProviderSelection();
      case 1:
        return renderCredentialsForm();
      case 2:
        return renderArchitectureForm();
      case 3:
        return renderReviewAndDeploy();
      case 4:
        return renderDeploymentMonitor();
      default:
        return renderProviderSelection();
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0:
        return selectedProvider !== '';
      case 1:
        return credentialsValid;
      case 2:
        return architecture.instanceType && architecture.os;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Cloud className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Multi-Cloud Provisioning</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Deploy virtual machines across AWS, Azure, and Google Cloud with automated Terraform provisioning
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep < 4 && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div key={index} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                        index <= currentStep
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <div className={`text-sm font-medium ${
                        index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        Step {index + 1}
                      </div>
                      <div className={`text-sm ${
                        index <= currentStep ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-8 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {getStepContent()}
        </div>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="max-w-6xl mx-auto mt-12 flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
              disabled={!canProceedToNextStep()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 3 ? 'Review' : 'Next'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <Info className="w-4 h-4 mr-1" />
              <span>Secure credential handling</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>Enterprise-grade security</span>
            </div>
            <div className="flex items-center">
              <Cloud className="w-4 h-4 mr-1" />
              <span>Multi-cloud support</span>
            </div>
          </div>
          <p className="mt-4">
            Powered by Terraform • Infrastructure as Code • © 2024 Multi-Cloud Provisioning
          </p>
        </div>
      </div>
    </div>
  )
};
export default MultiCloudProvisioning;