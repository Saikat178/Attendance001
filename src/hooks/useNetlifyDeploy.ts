import { useState, useEffect, useCallback } from 'react';
import { 
  deployToNetlify, 
  checkDeploymentStatus, 
  getDeploymentLogs,
  getDeploymentHistory,
  NetlifyDeployResponse,
  NetlifyDeployConfig,
  canDeploy
} from '../utils/netlify-deploy';

export const useNetlifyDeploy = () => {
  const [currentDeployment, setCurrentDeployment] = useState<NetlifyDeployResponse | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<NetlifyDeployResponse[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load deployment history on mount
  useEffect(() => {
    const history = getDeploymentHistory();
    setDeploymentHistory(history);
    
    // Check if there's an ongoing deployment
    const savedDeployment = localStorage.getItem('netlify_deployment');
    if (savedDeployment) {
      const deployment = JSON.parse(savedDeployment);
      setCurrentDeployment(deployment);
      
      // If deployment is in progress, start polling
      if (deployment.state === 'building' || deployment.state === 'processing') {
        setIsDeploying(true);
        pollDeploymentStatus(deployment.id);
      }
    }
  }, []);

  const pollDeploymentStatus = useCallback(async (deploymentId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const status = await checkDeploymentStatus(deploymentId);
        setCurrentDeployment(status);

        // Get logs
        const logs = await getDeploymentLogs(deploymentId);
        setDeploymentLogs(logs.slice(0, Math.min(attempts, logs.length)));

        if (status.state === 'ready' || status.state === 'error') {
          setIsDeploying(false);
          
          if (status.state === 'ready') {
            // Add to history
            const history = getDeploymentHistory();
            const updatedHistory = [...history, status];
            setDeploymentHistory(updatedHistory);
            localStorage.setItem('deployment_history', JSON.stringify(updatedHistory.slice(-10)));
          }
          
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          // Timeout
          setError('Deployment timeout - please check Netlify dashboard');
          setIsDeploying(false);
        }
      } catch (error: any) {
        console.error('Error polling deployment status:', error);
        setError(error.message);
        setIsDeploying(false);
      }
    };

    poll();
  }, []);

  const startDeployment = useCallback(async (config?: NetlifyDeployConfig) => {
    try {
      setError(null);
      setIsDeploying(true);
      setDeploymentLogs([]);

      // Check if deployment is possible
      const deployCheck = canDeploy();
      if (!deployCheck.canDeploy) {
        throw new Error(deployCheck.reason || 'Cannot deploy at this time');
      }

      // Start deployment
      const deployment = await deployToNetlify(config);
      setCurrentDeployment(deployment);

      // Start polling for status
      pollDeploymentStatus(deployment.id);

      return deployment;
    } catch (error: any) {
      console.error('Deployment error:', error);
      setError(error.message);
      setIsDeploying(false);
      throw error;
    }
  }, [pollDeploymentStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearCurrentDeployment = useCallback(() => {
    setCurrentDeployment(null);
    localStorage.removeItem('netlify_deployment');
  }, []);

  return {
    currentDeployment,
    deploymentHistory,
    isDeploying,
    deploymentLogs,
    error,
    startDeployment,
    clearError,
    clearCurrentDeployment,
    canDeploy: canDeploy()
  };
};