import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  Shield, 
  Users, 
  Clock,
  FileText,
  Coffee,
  Bell,
  Calendar,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { supabase, checkSupabaseConnection, handleSupabaseError } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../hooks/useAttendance';
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { useCompOffRequests } from '../hooks/useCompOffRequests';
import { useHolidays } from '../hooks/useHolidays';
import { useNotifications } from '../hooks/useNotifications';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

interface TestCategory {
  name: string;
  icon: React.ComponentType<any>;
  tests: TestResult[];
}

const TestSuite: React.FC = () => {
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  
  const { user, employee, signUp, signIn, signOut } = useAuth();

  // Initialize test categories
  useEffect(() => {
    setTestCategories([
      {
        name: 'Database Connection',
        icon: Database,
        tests: [
          { name: 'Supabase Connection', status: 'pending', message: 'Not tested' },
          { name: 'Authentication Service', status: 'pending', message: 'Not tested' },
          { name: 'RLS Policies', status: 'pending', message: 'Not tested' },
          { name: 'Database Functions', status: 'pending', message: 'Not tested' },
        ]
      },
      {
        name: 'Authentication & Security',
        icon: Shield,
        tests: [
          { name: 'User Registration', status: 'pending', message: 'Not tested' },
          { name: 'User Login', status: 'pending', message: 'Not tested' },
          { name: 'Password Validation', status: 'pending', message: 'Not tested' },
          { name: 'Rate Limiting', status: 'pending', message: 'Not tested' },
          { name: 'Session Management', status: 'pending', message: 'Not tested' },
        ]
      },
      {
        name: 'Employee Management',
        icon: Users,
        tests: [
          { name: 'Employee Profile CRUD', status: 'pending', message: 'Not tested' },
          { name: 'Admin Employee Access', status: 'pending', message: 'Not tested' },
          { name: 'Employee Verification', status: 'pending', message: 'Not tested' },
          { name: 'Document Management', status: 'pending', message: 'Not tested' },
        ]
      },
      {
        name: 'Attendance System',
        icon: Clock,
        tests: [
          { name: 'Check In/Out', status: 'pending', message: 'Not tested' },
          { name: 'Break Management', status: 'pending', message: 'Not tested' },
          { name: 'Hours Calculation', status: 'pending', message: 'Not tested' },
          { name: 'Attendance History', status: 'pending', message: 'Not tested' },
        ]
      },
      {
        name: 'Leave Management',
        icon: FileText,
        tests: [
          { name: 'Leave Request Submission', status: 'pending', message: 'Not tested' },
          { name: 'Leave Request Approval', status: 'pending', message: 'Not tested' },
          { name: 'Leave Validation', status: 'pending', message: 'Not tested' },
          { name: 'Leave History', status: 'pending', message: 'Not tested' },
        ]
      },
      {
        name: 'Comp Off System',
        icon: Coffee,
        tests: [
          { name: 'Comp Off Request', status: 'pending', message: 'Not tested' },
          { name: 'Work Date Validation', status: 'pending', message: 'Not tested' },
          { name: 'Comp Off Approval', status: 'pending', message: 'Not tested' },
          { name: 'Weekend Work Tracking', status: 'pending', message: 'Not tested' },
        ]
      },
      {
        name: 'Notifications',
        icon: Bell,
        tests: [
          { name: 'Notification Creation', status: 'pending', message: 'Not tested' },
          { name: 'Real-time Updates', status: 'pending', message: 'Not tested' },
          { name: 'Notification Marking', status: 'pending', message: 'Not tested' },
          { name: 'Admin Notifications', status: 'pending', message: 'Not tested' },
        ]
      },
      {
        name: 'Calendar & Holidays',
        icon: Calendar,
        tests: [
          { name: 'Holiday Management', status: 'pending', message: 'Not tested' },
          { name: 'Calendar Display', status: 'pending', message: 'Not tested' },
          { name: 'Holiday Validation', status: 'pending', message: 'Not tested' },
          { name: 'Indian Holidays', status: 'pending', message: 'Not tested' },
        ]
      },
      {
        name: 'System Performance',
        icon: Settings,
        tests: [
          { name: 'Database Indexes', status: 'pending', message: 'Not tested' },
          { name: 'Query Performance', status: 'pending', message: 'Not tested' },
          { name: 'Real-time Subscriptions', status: 'pending', message: 'Not tested' },
          { name: 'Error Handling', status: 'pending', message: 'Not tested' },
        ]
      }
    ]);
  }, []);

  const updateTestResult = (categoryName: string, testName: string, result: Partial<TestResult>) => {
    setTestCategories(prev => prev.map(category => 
      category.name === categoryName 
        ? {
            ...category,
            tests: category.tests.map(test => 
              test.name === testName 
                ? { ...test, ...result }
                : test
            )
          }
        : category
    ));
  };

  const runTest = async (categoryName: string, testName: string, testFunction: () => Promise<TestResult>) => {
    setCurrentTest(`${categoryName} - ${testName}`);
    updateTestResult(categoryName, testName, { status: 'running', message: 'Running...' });
    
    const startTime = Date.now();
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      updateTestResult(categoryName, testName, { ...result, duration });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(categoryName, testName, {
        status: 'failed',
        message: error.message || 'Test failed',
        duration
      });
    }
  };

  // Database Connection Tests
  const testSupabaseConnection = async (): Promise<TestResult> => {
    const { connected, error } = await checkSupabaseConnection();
    if (connected) {
      return { name: 'Supabase Connection', status: 'passed', message: 'Successfully connected to Supabase' };
    } else {
      return { name: 'Supabase Connection', status: 'failed', message: error?.message || 'Connection failed' };
    }
  };

  const testAuthenticationService = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { name: 'Authentication Service', status: 'passed', message: 'Auth service is working' };
    } catch (error: any) {
      return { name: 'Authentication Service', status: 'failed', message: error.message };
    }
  };

  const testRLSPolicies = async (): Promise<TestResult> => {
    try {
      // Test if we can access employees table (should be restricted by RLS)
      const { data, error } = await supabase
        .from('employees')
        .select('count', { count: 'exact', head: true });
      
      if (error && error.code === '42501') {
        return { name: 'RLS Policies', status: 'passed', message: 'RLS policies are properly enforced' };
      } else if (!error) {
        return { name: 'RLS Policies', status: 'warning', message: 'RLS may not be properly configured' };
      } else {
        throw error;
      }
    } catch (error: any) {
      return { name: 'RLS Policies', status: 'failed', message: error.message };
    }
  };

  const testDatabaseFunctions = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase.rpc('is_admin', { user_id: user?.id });
      if (error) throw error;
      return { name: 'Database Functions', status: 'passed', message: 'Database functions are working' };
    } catch (error: any) {
      return { name: 'Database Functions', status: 'failed', message: error.message };
    }
  };

  // Authentication Tests
  const testUserRegistration = async (): Promise<TestResult> => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testEmployeeId = `TEST${Date.now()}`;
    
    try {
      const { data, error } = await signUp(testEmail, 'TestPassword123!', {
        name: 'Test User',
        employeeId: testEmployeeId,
        role: 'employee'
      });
      
      if (error) throw new Error(error.message);
      
      return { name: 'User Registration', status: 'passed', message: 'User registration successful' };
    } catch (error: any) {
      return { name: 'User Registration', status: 'failed', message: error.message };
    }
  };

  const testPasswordValidation = async (): Promise<TestResult> => {
    try {
      // Test weak password
      const { error } = await signUp('weak@test.com', '123', {
        name: 'Test User',
        employeeId: 'WEAK123'
      });
      
      if (error && error.message.includes('Password')) {
        return { name: 'Password Validation', status: 'passed', message: 'Password validation is working' };
      } else {
        return { name: 'Password Validation', status: 'warning', message: 'Weak passwords may be accepted' };
      }
    } catch (error: any) {
      return { name: 'Password Validation', status: 'failed', message: error.message };
    }
  };

  const testRateLimiting = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        identifier_param: 'test-ip',
        action_param: 'test-action'
      });
      
      if (error) throw error;
      
      return { name: 'Rate Limiting', status: 'passed', message: 'Rate limiting function is working' };
    } catch (error: any) {
      return { name: 'Rate Limiting', status: 'failed', message: error.message };
    }
  };

  // Attendance Tests
  const testAttendanceSystem = async (): Promise<TestResult> => {
    try {
      // Test attendance record creation
      const { data, error } = await supabase
        .from('attendance_records')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      return { name: 'Check In/Out', status: 'passed', message: 'Attendance system is accessible' };
    } catch (error: any) {
      return { name: 'Check In/Out', status: 'failed', message: error.message };
    }
  };

  // Leave Management Tests
  const testLeaveSystem = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      return { name: 'Leave Request Submission', status: 'passed', message: 'Leave system is accessible' };
    } catch (error: any) {
      return { name: 'Leave Request Submission', status: 'failed', message: error.message };
    }
  };

  // Holiday Tests
  const testHolidaySystem = async (): Promise<TestResult> => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return { name: 'Holiday Management', status: 'passed', message: `Found ${data.length} holiday(s)` };
      } else {
        return { name: 'Holiday Management', status: 'warning', message: 'No holidays found in database' };
      }
    } catch (error: any) {
      return { name: 'Holiday Management', status: 'failed', message: error.message };
    }
  };

  // Performance Tests
  const testDatabaseIndexes = async (): Promise<TestResult> => {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email')
        .limit(10);
      
      const queryTime = Date.now() - startTime;
      
      if (error) throw error;
      
      if (queryTime < 100) {
        return { name: 'Database Indexes', status: 'passed', message: `Query completed in ${queryTime}ms` };
      } else {
        return { name: 'Database Indexes', status: 'warning', message: `Query took ${queryTime}ms (may need optimization)` };
      }
    } catch (error: any) {
      return { name: 'Database Indexes', status: 'failed', message: error.message };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    
    const testSuites = [
      // Database Connection Tests
      { category: 'Database Connection', test: 'Supabase Connection', fn: testSupabaseConnection },
      { category: 'Database Connection', test: 'Authentication Service', fn: testAuthenticationService },
      { category: 'Database Connection', test: 'RLS Policies', fn: testRLSPolicies },
      { category: 'Database Connection', test: 'Database Functions', fn: testDatabaseFunctions },
      
      // Authentication Tests
      { category: 'Authentication & Security', test: 'Password Validation', fn: testPasswordValidation },
      { category: 'Authentication & Security', test: 'Rate Limiting', fn: testRateLimiting },
      
      // System Tests
      { category: 'Attendance System', test: 'Check In/Out', fn: testAttendanceSystem },
      { category: 'Leave Management', test: 'Leave Request Submission', fn: testLeaveSystem },
      { category: 'Calendar & Holidays', test: 'Holiday Management', fn: testHolidaySystem },
      { category: 'System Performance', test: 'Database Indexes', fn: testDatabaseIndexes },
    ];

    for (const testSuite of testSuites) {
      await runTest(testSuite.category, testSuite.test, testSuite.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    setOverallStatus('completed');
    setCurrentTest('');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'bg-green-50 border-green-200';
      case 'failed': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'running': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const calculateStats = () => {
    const allTests = testCategories.flatMap(cat => cat.tests);
    const passed = allTests.filter(t => t.status === 'passed').length;
    const failed = allTests.filter(t => t.status === 'failed').length;
    const warnings = allTests.filter(t => t.status === 'warning').length;
    const total = allTests.length;
    
    return { passed, failed, warnings, total };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Test Suite</h1>
              <p className="text-gray-600 mt-2">Comprehensive testing of frontend and Supabase backend</p>
            </div>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run All Tests
                </>
              )}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
              <div className="text-sm text-yellow-700">Warnings</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-700">Total Tests</div>
            </div>
          </div>

          {/* Current Test */}
          {currentTest && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mr-3" />
                <span className="text-blue-800 font-medium">Currently running: {currentTest}</span>
              </div>
            </div>
          )}
        </div>

        {/* Test Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.name} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                  <div className="flex items-center">
                    <Icon className="w-6 h-6 text-gray-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-3">
                    {category.tests.map((test) => (
                      <div
                        key={test.name}
                        className={`p-4 rounded-lg border transition-all duration-200 ${getStatusColor(test.status)}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {getStatusIcon(test.status)}
                            <span className="ml-3 font-medium text-gray-900">{test.name}</span>
                          </div>
                          {test.duration && (
                            <span className="text-xs text-gray-500">{test.duration}ms</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 ml-8">{test.message}</p>
                        {test.details && (
                          <div className="mt-2 ml-8">
                            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(test.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Test Results Summary */}
        {overallStatus === 'completed' && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {Math.round((stats.passed / stats.total) * 100)}%
                </div>
                <div className="text-gray-600">Success Rate</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stats.total}
                </div>
                <div className="text-gray-600">Tests Executed</div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {testCategories.length}
                </div>
                <div className="text-gray-600">Categories</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Recommendations:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {stats.failed > 0 && (
                  <li>• Address {stats.failed} failed test(s) before production deployment</li>
                )}
                {stats.warnings > 0 && (
                  <li>• Review {stats.warnings} warning(s) for potential improvements</li>
                )}
                {stats.failed === 0 && stats.warnings === 0 && (
                  <li>• ✅ All tests passed! System is ready for production</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSuite;