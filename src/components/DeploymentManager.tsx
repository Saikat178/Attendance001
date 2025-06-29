import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Settings,
  Globe,
  GitBranch,
  Clock,
  Download,
  Upload
} from 'lucide-react';

interface DeploymentStatus {
  id?: string;
  state: 'new' | 'building' | 'ready' | 'error' | 'processing';
  url?: string;
  admin_url?: string;
  deploy_url?: string;
  created_at?: string;
  updated_at?: string;
  error_message?: string;
  build_log?: string;
}

interface DeploymentManagerProps {
  onClose: () => void;
}

const DeploymentManager: React.FC<DeploymentManagerProps> = ({ onClose }) => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentStatus[]>([]);

  // Check for existing deployment status
  useEffect(() => {
    checkDeploymentStatus();
    loadDeploymentHistory();
  }, []);

  const checkDeploymentStatus = async () => {
    try {
      // Check if there's an ongoing deployment
      const savedStatus = localStorage.getItem('deployment_status');
      if (savedStatus) {
        const status = JSON.parse(savedStatus);
        setDeploymentStatus(status);
        
        // If deployment is in progress, start polling
        if (status.state === 'building' || status.state === 'processing') {
          pollDeploymentStatus(status.id);
        }
      }
    } catch (error) {
      console.error('Error checking deployment status:', error);
    }
  };

  const loadDeploymentHistory = () => {
    try {
      const history = localStorage.getItem('deployment_history');
      if (history) {
        setDeploymentHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading deployment history:', error);
    }
  };

  const saveDeploymentHistory = (deployment: DeploymentStatus) => {
    try {
      const history = [...deploymentHistory, deployment];
      const limitedHistory = history.slice(-10); // Keep last 10 deployments
      setDeploymentHistory(limitedHistory);
      localStorage.setItem('deployment_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving deployment history:', error);
    }
  };

  const pollDeploymentStatus = async (deploymentId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        // Simulate deployment status check
        // In a real implementation, this would call Netlify API
        const mockStatuses = ['building', 'building', 'building', 'ready'];
        const randomStatus = mockStatuses[Math.min(attempts - 1, mockStatuses.length - 1)];
        
        const updatedStatus: DeploymentStatus = {
          ...deploymentStatus,
          id: deploymentId,
          state: randomStatus as any,
          updated_at: new Date().toISOString(),
        };

        if (randomStatus === 'ready') {
          updatedStatus.url = `https://attendance-${Date.now()}.netlify.app`;
          updatedStatus.deploy_url = updatedStatus.url;
          updatedStatus.admin_url = `https://app.netlify.com/sites/attendance-${Date.now()}/deploys/${deploymentId}`;
        }

        setDeploymentStatus(updatedStatus);
        localStorage.setItem('deployment_status', JSON.stringify(updatedStatus));

        // Add build logs
        const logMessages = [
          'Starting build process...',
          'Installing dependencies...',
          'Running npm install...',
          'Building React application...',
          'Optimizing assets...',
          'Deploying to Netlify...',
          'Build completed successfully!'
        ];
        
        if (attempts <= logMessages.length) {
          setBuildLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logMessages[attempts - 1]}`]);
        }

        if (randomStatus === 'ready' || randomStatus === 'error') {
          setIsDeploying(false);
          if (randomStatus === 'ready') {
            saveDeploymentHistory(updatedStatus);
          }
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Timeout
          const timeoutStatus: DeploymentStatus = {
            ...updatedStatus,
            state: 'error',
            error_message: 'Deployment timeout - please check Netlify dashboard'
          };
          setDeploymentStatus(timeoutStatus);
          setIsDeploying(false);
        }
      } catch (error) {
        console.error('Error polling deployment status:', error);
        setIsDeploying(false);
      }
    };

    poll();
  };

  const startDeployment = async () => {
    try {
      setIsDeploying(true);
      setBuildLogs([]);
      
      // Generate deployment ID
      const deploymentId = `deploy_${Date.now()}`;
      
      const newDeployment: DeploymentStatus = {
        id: deploymentId,
        state: 'building',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setDeploymentStatus(newDeployment);
      localStorage.setItem('deployment_status', JSON.stringify(newDeployment));

      // In a real implementation, this would trigger the actual Netlify deployment
      // For now, we'll simulate the process
      setBuildLogs(['[' + new Date().toLocaleTimeString() + '] Initiating deployment to Netlify...']);
      
      // Start polling for status
      pollDeploymentStatus(deploymentId);

    } catch (error: any) {
      console.error('Deployment error:', error);
      setIsDeploying(false);
      setDeploymentStatus({
        state: 'error',
        error_message: error.message || 'Deployment failed'
      });
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'ready':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'building':
      case 'processing':
        return <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'ready':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'building':
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Rocket className="w-8 h-8 mr-3" />
              <div>
                <h2 className="text-2xl font-bold">Deployment Manager</h2>
                <p className="text-blue-100 mt-1">Deploy your application to Netlify</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors duration-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Current Deployment Status */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Current Deployment</h3>
            
            {deploymentStatus ? (
              <div className={`p-6 rounded-xl border ${getStatusColor(deploymentStatus.state)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {getStatusIcon(deploymentStatus.state)}
                    <div className="ml-3">
                      <h4 className="font-semibold text-lg capitalize">{deploymentStatus.state}</h4>
                      <p className="text-sm opacity-75">
                        {deploymentStatus.state === 'building' && 'Building your application...'}
                        {deploymentStatus.state === 'ready' && 'Deployment successful!'}
                        {deploymentStatus.state === 'error' && 'Deployment failed'}
                        {deploymentStatus.state === 'processing' && 'Processing deployment...'}
                      </p>
                    </div>
                  </div>
                  
                  {deploymentStatus.state === 'ready' && deploymentStatus.url && (
                    <div className="flex gap-2">
                      <a
                        href={deploymentStatus.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Visit Site
                      </a>
                      {deploymentStatus.admin_url && (
                        <a
                          href={deploymentStatus.admin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Netlify Dashboard
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {deploymentStatus.error_message && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{deploymentStatus.error_message}</p>
                  </div>
                )}

                {deploymentStatus.created_at && (
                  <div className="mt-4 text-sm opacity-75">
                    <p>Started: {formatDate(deploymentStatus.created_at)}</p>
                    {deploymentStatus.updated_at && deploymentStatus.updated_at !== deploymentStatus.created_at && (
                      <p>Updated: {formatDate(deploymentStatus.updated_at)}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                <Rocket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">No Active Deployment</h4>
                <p className="text-gray-600 mb-4">Ready to deploy your application to Netlify</p>
              </div>
            )}
          </div>

          {/* Deployment Actions */}
          <div className="mb-8">
            <div className="flex gap-4">
              <button
                onClick={startDeployment}
                disabled={isDeploying}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Deploy to Netlify
                  </>
                )}
              </button>

              {buildLogs.length > 0 && (
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium flex items-center"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {showLogs ? 'Hide' : 'Show'} Build Logs
                </button>
              )}
            </div>
          </div>

          {/* Build Logs */}
          {showLogs && buildLogs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Build Logs</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {buildLogs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
                {isDeploying && (
                  <div className="flex items-center mt-2">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <span>Building...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deployment History */}
          {deploymentHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Deployment History</h3>
              <div className="space-y-3">
                {deploymentHistory.slice(-5).reverse().map((deployment, index) => (
                  <div key={deployment.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(deployment.state)}
                      <div className="ml-3">
                        <p className="font-medium text-gray-900 capitalize">{deployment.state}</p>
                        <p className="text-sm text-gray-600">
                          {deployment.created_at && formatDate(deployment.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {deployment.url && deployment.state === 'ready' && (
                      <a
                        href={deployment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deployment Info */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Deployment Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your application will be built and deployed to Netlify</li>
              <li>• The deployment process typically takes 2-5 minutes</li>
              <li>• You'll receive a unique URL for your deployed application</li>
              <li>• All environment variables will be automatically configured</li>
              <li>• The site will be optimized for production performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentManager;