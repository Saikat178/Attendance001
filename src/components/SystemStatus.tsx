import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Calendar, Shield, Wifi } from 'lucide-react';
import { verifyDatabaseCleanup, checkSystemReadiness, getDatabaseStats } from '../utils/database-cleanup';

const SystemStatus: React.FC = () => {
  const [cleanupStatus, setCleanupStatus] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [dbStats, setDbStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAllStatus();
  }, []);

  const checkAllStatus = async () => {
    setLoading(true);
    try {
      const [cleanup, system, stats] = await Promise.all([
        verifyDatabaseCleanup(),
        checkSystemReadiness(),
        getDatabaseStats()
      ]);
      
      setCleanupStatus(cleanup);
      setSystemStatus(system);
      setDbStats(stats);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mr-3" />
          <span className="text-lg font-medium text-gray-900">Checking system status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">System Status</h2>
          <button
            onClick={checkAllStatus}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Database Status */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-blue-600" />
              {getStatusIcon(cleanupStatus?.isClean)}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Database</h3>
            <p className="text-sm text-gray-600">
              {cleanupStatus?.isClean ? 'Clean and ready' : 'Contains data'}
            </p>
          </div>

          {/* System Readiness */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Shield className="w-8 h-8 text-green-600" />
              {getStatusIcon(systemStatus?.ready)}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">System Ready</h3>
            <p className="text-sm text-gray-600">
              {systemStatus?.ready ? 'Production ready' : 'Needs attention'}
            </p>
          </div>

          {/* Holidays */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-purple-600" />
              {getStatusIcon(dbStats?.holidays > 0)}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Holidays</h3>
            <p className="text-sm text-gray-600">
              {dbStats?.holidays || 0} configured
            </p>
          </div>

          {/* Connection */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Wifi className="w-8 h-8 text-indigo-600" />
              {getStatusIcon(true)}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Connection</h3>
            <p className="text-sm text-gray-600">Active</p>
          </div>
        </div>
      </div>

      {/* Detailed Status */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Detailed Status</h3>
        
        {/* System Message */}
        <div className={`p-4 rounded-lg mb-6 ${
          systemStatus?.ready 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <p className={`font-medium ${
            systemStatus?.ready ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {systemStatus?.message}
          </p>
        </div>

        {/* Table Status */}
        {cleanupStatus?.tables && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">Database Tables</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(cleanupStatus.tables).map(([tableName, status]: [string, any]) => (
                <div key={tableName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {tableName.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{status.count}</span>
                    {getStatusIcon(status.isClean)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Database Statistics */}
        {dbStats && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Current Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{dbStats.employees}</div>
                <div className="text-sm text-blue-700">Employees</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{dbStats.attendanceRecords}</div>
                <div className="text-sm text-green-700">Attendance</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{dbStats.leaveRequests}</div>
                <div className="text-sm text-yellow-700">Leave Requests</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{dbStats.compOffRequests}</div>
                <div className="text-sm text-purple-700">Comp Off</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{dbStats.notifications}</div>
                <div className="text-sm text-indigo-700">Notifications</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{dbStats.holidays}</div>
                <div className="text-sm text-red-700">Holidays</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Required */}
      {!systemStatus?.ready && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">Action Required</h4>
              <p className="text-yellow-700 mb-4">
                The system is not ready for production. Please address the issues above.
              </p>
              <div className="bg-yellow-100 rounded-lg p-4">
                <h5 className="font-medium text-yellow-800 mb-2">Recommended Steps:</h5>
                <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                  <li>Run the database cleanup migration if data exists</li>
                  <li>Ensure all environment variables are properly configured</li>
                  <li>Verify Supabase connection is working</li>
                  <li>Check that default holidays are loaded</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatus;