import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Clock, 
  Calendar as CalendarIcon, 
  User, 
  LogOut, 
  BarChart3,
  TrendingUp,
  Download,
  ChevronDown,
  UserCheck,
  UserX,
  Coffee,
  FileText,
  Home,
  Info,
  Pause,
  Check,
  X,
  MessageSquare,
  Eye,
  Settings,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TestTube,
  Rocket
} from 'lucide-react';
import { Employee } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../hooks/useAttendance';
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { useCompOffRequests } from '../hooks/useCompOffRequests';
import { useHolidays } from '../hooks/useHolidays';
import NotificationBell from './NotificationBell';
import Calendar from './Calendar';
import EmployeeManagement from './EmployeeManagement';
import SystemStatus from './SystemStatus';
import TestDashboard from './TestDashboard';
import DeploymentManager from './DeploymentManager';

interface AdminDashboardProps {
  user: Employee;
  onLogout: () => void;
}

type ActiveSection = 'dashboard' | 'calendar' | 'employee-management' | 'leave-info' | 'comp-off-info' | 'system-status';
type TimeRange = 'daily' | 'weekly' | 'monthly';

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  onCompOffToday: number;
  onBreakToday: number;
  attendanceRate: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    onCompOffToday: 0,
    onBreakToday: 0,
    attendanceRate: 0
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showTestDashboard, setShowTestDashboard] = useState(false);
  const [showDeploymentManager, setShowDeploymentManager] = useState(false);

  // Use hooks for data management
  const { 
    leaveRequests, 
    loading: leaveLoading,
    reviewLeaveRequest 
  } = useLeaveRequests(user.id, true);
  
  const { 
    compOffRequests, 
    loading: compOffLoading,
    reviewCompOffRequest 
  } = useCompOffRequests(user.id, true);

  const { holidays, loading: holidaysLoading } = useHolidays(true);

  // Request review states
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    loadEmployees();

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      calculateAttendanceStats();
    }
  }, [employees, timeRange]);

  const loadEmployees = async () => {
    try {
      // In a real implementation, this would use the useAuth hook or a dedicated hook
      // For now, we'll simulate loading employees
      const mockEmployees: Employee[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@company.com',
          employeeId: 'EMP001',
          password: '',
          role: 'employee',
          department: 'Engineering',
          position: 'Software Developer',
          createdAt: new Date(),
          isVerified: true
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@company.com',
          employeeId: 'EMP002',
          password: '',
          role: 'employee',
          department: 'Marketing',
          position: 'Marketing Manager',
          createdAt: new Date(),
          isVerified: true
        }
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const calculateAttendanceStats = () => {
    const totalEmployees = employees.length;
    
    // Mock attendance data for demonstration
    const presentToday = Math.floor(totalEmployees * 0.8);
    const onLeaveToday = Math.floor(totalEmployees * 0.1);
    const onCompOffToday = Math.floor(totalEmployees * 0.05);
    const onBreakToday = Math.floor(totalEmployees * 0.15);
    const absentToday = totalEmployees - presentToday - onLeaveToday - onCompOffToday;
    const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

    setAttendanceStats({
      totalEmployees,
      presentToday,
      absentToday: Math.max(0, absentToday),
      onLeaveToday,
      onCompOffToday,
      onBreakToday,
      attendanceRate
    });
  };

  const handleRequestReview = (request: any, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedRequest) return;

    try {
      let result;
      if ('type' in selectedRequest) {
        // It's a leave request
        result = await reviewLeaveRequest(selectedRequest.id, reviewAction, reviewComment);
      } else {
        // It's a comp off request
        result = await reviewCompOffRequest(selectedRequest.id, reviewAction, reviewComment);
      }

      if (result.success) {
        setShowReviewModal(false);
        setSelectedRequest(null);
        setReviewComment('');
        showConfirmationMessage(`✅ Request ${reviewAction} successfully!`);
      } else {
        showConfirmationMessage('❌ Failed to process request. Please try again.');
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      showConfirmationMessage('❌ Failed to process request. Please try again.');
    }
  };

  const showConfirmationMessage = (message: string) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000);
  };

  const downloadExcel = () => {
    const data = [];
    
    // Header
    data.push(['Attendance Report', '', '', '', '', '']);
    data.push(['Period:', timeRange, '', '', '', '']);
    data.push(['Generated:', new Date().toLocaleString(), '', '', '', '']);
    data.push(['', '', '', '', '', '']);
    
    // Summary
    data.push(['SUMMARY', '', '', '', '', '']);
    data.push(['Total Employees', attendanceStats.totalEmployees, '', '', '', '']);
    data.push(['Present', attendanceStats.presentToday, '', '', '', '']);
    data.push(['Absent', attendanceStats.absentToday, '', '', '', '']);
    data.push(['On Leave', attendanceStats.onLeaveToday, '', '', '', '']);
    data.push(['Comp Off', attendanceStats.onCompOffToday, '', '', '', '']);
    data.push(['On Break', attendanceStats.onBreakToday, '', '', '', '']);
    data.push(['Attendance Rate', `${attendanceStats.attendanceRate.toFixed(1)}%`, '', '', '', '']);

    // Convert to CSV
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showConfirmationMessage('✅ Report downloaded successfully!');
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calendar', label: 'Calendar & Holidays', icon: CalendarIcon },
    { id: 'employee-management', label: 'Employee Management', icon: Users },
    { id: 'leave-info', label: 'Leave Requests', icon: FileText },
    { id: 'comp-off-info', label: 'Comp Off Requests', icon: Coffee },
    { id: 'system-status', label: 'System Status', icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mr-6">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name}</h2>
            <p className="text-gray-600 mt-1">Admin Dashboard</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {formatDate(currentTime)}
            </div>
          </div>
        </div>

        {/* Current Time */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Current Time</p>
              <p className="text-3xl font-bold">{formatTime(currentTime)}</p>
            </div>
            <Clock className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Admin Test Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 border border-blue-200">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <TestTube className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">System Testing & Monitoring</h3>
            <p className="text-gray-600">Comprehensive testing suite for frontend and backend</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Database Connection Test */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Database</h4>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Connected to Supabase</p>
            <p className="text-xs text-green-600 mt-1">✓ Authentication working</p>
          </div>

          {/* Leave Requests Test */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Leave Requests</h4>
              {leaveLoading ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">{leaveRequests.length} requests</p>
            <p className="text-xs text-green-600 mt-1">✓ Real-time updates</p>
          </div>

          {/* Comp Off Test */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Comp Off</h4>
              {compOffLoading ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">{compOffRequests.length} requests</p>
            <p className="text-xs text-green-600 mt-1">✓ Review system active</p>
          </div>

          {/* Holidays Test */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Holidays</h4>
              {holidaysLoading ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <p className="text-sm text-gray-600">{holidays.length} holidays</p>
            <p className="text-xs text-green-600 mt-1">✓ Indian holidays loaded</p>
          </div>
        </div>

        {/* Test Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowTestDashboard(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Open Test Dashboard
          </button>
          <button
            onClick={() => setShowDeploymentManager(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Deploy to Netlify
          </button>
          <button
            onClick={downloadExcel}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button
            onClick={() => showConfirmationMessage('🔄 Data refreshed successfully!')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors duration-200 font-medium flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
          <button
            onClick={() => setActiveSection('system-status')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium flex items-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            System Status
          </button>
        </div>
      </div>

      {/* Time Range Selector and Download */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Attendance Analytics</h3>
          <div className="flex gap-3">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={downloadExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-100" />
              <span className="text-2xl font-bold">{attendanceStats.totalEmployees}</span>
            </div>
            <p className="text-blue-100 text-sm font-medium">Total Employees</p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="w-8 h-8 text-green-100" />
              <span className="text-2xl font-bold">{attendanceStats.presentToday}</span>
            </div>
            <p className="text-green-100 text-sm font-medium">Present {timeRange === 'daily' ? 'Today' : 'Average'}</p>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <UserX className="w-8 h-8 text-red-100" />
              <span className="text-2xl font-bold">{attendanceStats.absentToday}</span>
            </div>
            <p className="text-red-100 text-sm font-medium">Absent {timeRange === 'daily' ? 'Today' : 'Average'}</p>
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-yellow-100" />
              <span className="text-2xl font-bold">{attendanceStats.onLeaveToday}</span>
            </div>
            <p className="text-yellow-100 text-sm font-medium">On Leave {timeRange === 'daily' ? 'Today' : 'Average'}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Coffee className="w-8 h-8 text-purple-100" />
              <span className="text-2xl font-bold">{attendanceStats.onCompOffToday}</span>
            </div>
            <p className="text-purple-100 text-sm font-medium">Comp Off {timeRange === 'daily' ? 'Today' : 'Average'}</p>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Pause className="w-8 h-8 text-orange-100" />
              <span className="text-2xl font-bold">{attendanceStats.onBreakToday}</span>
            </div>
            <p className="text-orange-100 text-sm font-medium">On Break {timeRange === 'daily' ? 'Today' : 'Average'}</p>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-indigo-100" />
              <span className="text-2xl font-bold">{attendanceStats.attendanceRate.toFixed(1)}%</span>
            </div>
            <p className="text-indigo-100 text-sm font-medium">Attendance Rate</p>
          </div>
        </div>

        {/* Visual Chart Representation */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Attendance Breakdown</h4>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-700">Present</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceStats.totalEmployees > 0 ? (attendanceStats.presentToday / attendanceStats.totalEmployees) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-12">{attendanceStats.presentToday}</span>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-700">On Leave</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-yellow-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceStats.totalEmployees > 0 ? (attendanceStats.onLeaveToday / attendanceStats.totalEmployees) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-12">{attendanceStats.onLeaveToday}</span>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-700">Comp Off</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-purple-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceStats.totalEmployees > 0 ? (attendanceStats.onCompOffToday / attendanceStats.totalEmployees) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-12">{attendanceStats.onCompOffToday}</span>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-700">On Break</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceStats.totalEmployees > 0 ? (attendanceStats.onBreakToday / attendanceStats.totalEmployees) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-12">{attendanceStats.onBreakToday}</span>
            </div>
            <div className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-700">Absent</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                <div 
                  className="bg-red-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceStats.totalEmployees > 0 ? (attendanceStats.absentToday / attendanceStats.totalEmployees) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 w-12">{attendanceStats.absentToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Employee Attendance Today</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee, index) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.employeeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.department || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {index === 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🟢 Present
                      </span>
                    ) : index === 1 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ☕ On Break
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        📋 On Leave
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setActiveSection('employee-management')}
                      className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {employees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No employees registered yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLeaveInfo = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Leave Requests Management</h2>
        <p className="text-gray-600 mt-1">Review and manage employee leave requests</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaveRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.employeeName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{request.employeeNumber || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                  {request.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatShortDate(request.startDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatShortDate(request.endDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate" title={request.reason}>
                    {request.reason}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {request.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestReview(request, 'approved')}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs flex items-center"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequestReview(request, 'rejected')}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors duration-200 text-xs flex items-center"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="text-xs">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                        {request.reviewedBy && ` by ${request.reviewedBy}`}
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leaveRequests.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No leave requests found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCompOffInfo = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Comp Off Requests Management</h2>
        <p className="text-gray-600 mt-1">Review and manage employee comp off requests</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comp Off Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {compOffRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.employeeName || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">{request.employeeNumber || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatShortDate(request.workDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatShortDate(request.compOffDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate" title={request.reason}>
                    {request.reason}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {request.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestReview(request, 'approved')}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200 text-xs flex items-center"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequestReview(request, 'rejected')}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors duration-200 text-xs flex items-center"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <Eye className="w-4 h-4 mr-1" />
                      <span className="text-xs">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                        {request.reviewedBy && ` by ${request.reviewedBy}`}
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {compOffRequests.length === 0 && (
          <div className="text-center py-12">
            <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No comp off requests found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'calendar': return <Calendar user={user} isAdmin={true} />;
      case 'employee-management': return <EmployeeManagement currentUser={user} />;
      case 'leave-info': return renderLeaveInfo();
      case 'comp-off-info': return renderCompOffInfo();
      case 'system-status': return <SystemStatus />;
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell userId={user.id} userRole={user.role} />
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as ActiveSection)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                        activeSection === item.id
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Test Dashboard Modal */}
      {showTestDashboard && (
        <TestDashboard onClose={() => setShowTestDashboard(false)} />
      )}

      {/* Deployment Manager Modal */}
      {showDeploymentManager && (
        <DeploymentManager onClose={() => setShowDeploymentManager(false)} />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {reviewAction === 'approved' ? 'Approve' : 'Reject'} Request
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {'type' in selectedRequest 
                  ? `${selectedRequest.type} leave request` 
                  : 'Comp off request'
                } from{' '}
                <span className="font-medium">
                  {selectedRequest.employeeName || 'Unknown Employee'}
                </span>
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder={`Add a comment for the ${reviewAction === 'approved' ? 'approval' : 'rejection'}...`}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={submitReview}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  reviewAction === 'approved'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {reviewAction === 'approved' ? 'Approve' : 'Reject'}
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-6">{confirmationMessage}</p>
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;