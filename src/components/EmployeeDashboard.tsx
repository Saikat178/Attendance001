import React, { useState, useEffect } from 'react';
import { 
  User, 
  Clock, 
  LogIn, 
  LogOut, 
  Calendar as CalendarIcon, 
  Building2, 
  CheckCircle, 
  Home,
  UserCircle,
  ClipboardList,
  FileText,
  Coffee,
  Edit3,
  Save,
  X,
  Plus,
  ChevronDown,
  Pause,
  Play,
  AlertCircle,
  Info
} from 'lucide-react';
import { Employee } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useAttendance } from '../hooks/useAttendance';
import { useLeaveRequests } from '../hooks/useLeaveRequests';
import { useCompOffRequests } from '../hooks/useCompOffRequests';
import NotificationBell from './NotificationBell';
import Calendar from './Calendar';

interface EmployeeDashboardProps {
  user: Employee;
  onLogout: () => void;
}

type ActiveSection = 'dashboard' | 'calendar' | 'profile' | 'attendance' | 'leave' | 'compoff';

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState(user);
  
  // Leave request state
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFormData, setLeaveFormData] = useState({
    type: 'vacation' as const,
    startDate: '',
    endDate: '',
    reason: ''
  });
  
  // Comp off state
  const [showCompOffForm, setShowCompOffForm] = useState(false);
  const [compOffFormData, setCompOffFormData] = useState({
    workDate: '',
    compOffDate: '',
    reason: ''
  });

  // Use custom hooks for data management
  const { updateProfile } = useAuth();
  const { 
    todayAttendance, 
    attendanceHistory, 
    loading: attendanceLoading,
    checkIn, 
    checkOut, 
    startBreak, 
    endBreak 
  } = useAttendance(user.id);
  
  const { 
    leaveRequests, 
    loading: leaveLoading,
    submitLeaveRequest 
  } = useLeaveRequests(user.id);
  
  const { 
    compOffRequests, 
    loading: compOffLoading,
    submitCompOffRequest 
  } = useCompOffRequests(user.id);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isCheckedIn = todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const isOnBreak = todayAttendance?.isOnBreak || false;

  const calculateHoursWorked = (checkIn: Date, checkOut?: Date): number => {
    const endTime = checkOut || new Date();
    const diffMs = endTime.getTime() - checkIn.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const calculateBreakTime = (breakStart: Date, breakEnd?: Date): number => {
    const endTime = breakEnd || new Date();
    const diffMs = endTime.getTime() - breakStart.getTime();
    return Math.round((diffMs / (1000 * 60)) * 100) / 100; // Return in minutes
  };

  const handleCheckIn = async () => {
    try {
      const result = await checkIn();
      if (result.success) {
        showConfirmationMessage('✅ Checked in successfully!');
      } else {
        showConfirmationMessage('❌ Failed to check in. Please try again.');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      showConfirmationMessage('❌ Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    try {
      const result = await checkOut();
      if (result.success) {
        showConfirmationMessage('✅ Checked out successfully!');
      } else {
        showConfirmationMessage('❌ Failed to check out. Please try again.');
      }
    } catch (error) {
      console.error('Check-out error:', error);
      showConfirmationMessage('❌ Failed to check out. Please try again.');
    }
  };

  const handleBreakStart = async () => {
    try {
      const result = await startBreak();
      if (result.success) {
        showConfirmationMessage('☕ Break time started!');
      } else {
        showConfirmationMessage('❌ Failed to start break. Please try again.');
      }
    } catch (error) {
      console.error('Start break error:', error);
      showConfirmationMessage('❌ Failed to start break. Please try again.');
    }
  };

  const handleBreakEnd = async () => {
    try {
      const result = await endBreak();
      if (result.success) {
        showConfirmationMessage('🔄 Resumed work!');
      } else {
        showConfirmationMessage('❌ Failed to end break. Please try again.');
      }
    } catch (error) {
      console.error('End break error:', error);
      showConfirmationMessage('❌ Failed to end break. Please try again.');
    }
  };

  const handleProfileSave = async () => {
    try {
      const result = await updateProfile(profileData);
      if (!result.error) {
        setIsEditingProfile(false);
        showConfirmationMessage('✅ Profile updated successfully!');
      } else {
        showConfirmationMessage('❌ Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showConfirmationMessage('❌ Failed to update profile. Please try again.');
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await submitLeaveRequest(leaveFormData);
      if (result.success) {
        setShowLeaveForm(false);
        setLeaveFormData({ type: 'vacation', startDate: '', endDate: '', reason: '' });
        showConfirmationMessage('✅ Leave request submitted successfully!');
      } else {
        showConfirmationMessage('❌ Failed to submit leave request. Please try again.');
      }
    } catch (error) {
      console.error('Leave request error:', error);
      showConfirmationMessage('❌ Failed to submit leave request. Please try again.');
    }
  };

  const handleCompOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await submitCompOffRequest(compOffFormData);
      if (result.success) {
        setShowCompOffForm(false);
        setCompOffFormData({ workDate: '', compOffDate: '', reason: '' });
        showConfirmationMessage('✅ Comp off request submitted successfully!');
      } else {
        showConfirmationMessage('❌ Failed to submit comp off request. Please try again.');
      }
    } catch (error) {
      console.error('Comp off request error:', error);
      showConfirmationMessage('❌ Failed to submit comp off request. Please try again.');
    }
  };

  const showConfirmationMessage = (message: string) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
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

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const isWeekend = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const validateWorkDate = (dateString: string) => {
    if (!dateString) return { isValid: false, message: '' };
    
    const selectedDate = new Date(dateString);
    const today = new Date();
    const dayOfWeek = getDayOfWeek(dateString);
    
    // Check if it's a future date
    if (selectedDate > today) {
      return { isValid: false, message: 'Work date cannot be in the future' };
    }
    
    // Check if it's a weekend
    if (isWeekend(dateString)) {
      return { isValid: true, message: `Valid non-working day (${dayOfWeek})` };
    }
    
    // For now, we'll allow any past date as it could be a holiday
    // In a real system, you'd check against a holiday calendar
    return { isValid: true, message: `Assuming ${dayOfWeek} was a holiday/non-working day` };
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calendar', label: 'Calendar & Holidays', icon: CalendarIcon },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
    { id: 'attendance', label: 'My Attendance', icon: ClipboardList },
    { id: 'leave', label: 'Leave Request', icon: FileText },
    { id: 'compoff', label: 'Comp Off', icon: Coffee },
  ];

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-6">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h2>
            <p className="text-gray-600 mt-1">Employee ID: {user.employeeId}</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <CalendarIcon className="w-4 h-4 mr-2" />
              {formatDate(currentTime)}
            </div>
          </div>
        </div>

        {/* Current Time */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Current Time</p>
              <p className="text-3xl font-bold">{formatTime(currentTime)}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Check-in Time */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Check-in Time</h3>
            <LogIn className="w-6 h-6 text-green-600" />
          </div>
          {todayAttendance?.checkIn ? (
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatTime(todayAttendance.checkIn)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Today</p>
            </div>
          ) : (
            <p className="text-gray-400 text-lg">Not checked in</p>
          )}
        </div>

        {/* Check-out Time */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Check-out Time</h3>
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          {todayAttendance?.checkOut ? (
            <div>
              <p className="text-2xl font-bold text-red-600">
                {formatTime(todayAttendance.checkOut)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Today</p>
            </div>
          ) : (
            <p className="text-gray-400 text-lg">Not checked out</p>
          )}
        </div>

        {/* Hours Worked */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Hours Worked</h3>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          {todayAttendance?.checkIn ? (
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {todayAttendance.checkOut 
                  ? todayAttendance.hoursWorked.toFixed(2)
                  : (calculateHoursWorked(new Date(todayAttendance.checkIn)) - (todayAttendance.totalBreakTime / 60)).toFixed(2)
                }h
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {todayAttendance.checkOut ? 'Total today' : 'So far today'}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-lg">0.00h</p>
          )}
        </div>

        {/* Break Time */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Break Time</h3>
            <Coffee className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {todayAttendance ? 
                (todayAttendance.isOnBreak && todayAttendance.breakStart ? 
                  (todayAttendance.totalBreakTime + calculateBreakTime(new Date(todayAttendance.breakStart))).toFixed(0) :
                  todayAttendance.totalBreakTime.toFixed(0)
                ) : '0'
              }m
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isOnBreak ? 'Currently on break' : 'Total today'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center">
        <div className={`px-6 py-3 rounded-full font-medium text-sm ${
          isOnBreak 
            ? 'bg-orange-100 text-orange-800 border border-orange-200' 
            : isCheckedIn 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          {isOnBreak ? '☕ Currently on Break' : isCheckedIn ? '🟢 Currently Checked In' : '🔴 Currently Checked Out'}
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔍 Attendance Debug Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Today's Date:</strong> {new Date().toISOString().split('T')[0]}</p>
            <p><strong>Attendance Loading:</strong> {attendanceLoading ? 'Yes' : 'No'}</p>
            <p><strong>Today's Record Exists:</strong> {todayAttendance ? 'Yes' : 'No'}</p>
          </div>
          <div>
            {todayAttendance && (
              <>
                <p><strong>Record ID:</strong> {todayAttendance.id}</p>
                <p><strong>Check-in:</strong> {todayAttendance.checkIn ? 'Yes' : 'No'}</p>
                <p><strong>Check-out:</strong> {todayAttendance.checkOut ? 'Yes' : 'No'}</p>
                <p><strong>On Break:</strong> {todayAttendance.isOnBreak ? 'Yes' : 'No'}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        {!isEditingProfile ? (
          <button
            onClick={() => setIsEditingProfile(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleProfileSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
            <button
              onClick={() => {
                setIsEditingProfile(false);
                setProfileData(user);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          {isEditingProfile ? (
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <p className="text-gray-900 font-medium">{user.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
          <p className="text-gray-900 font-medium">{user.employeeId}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <p className="text-gray-900 font-medium">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          {isEditingProfile ? (
            <input
              type="tel"
              value={profileData.phone || ''}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          ) : (
            <p className="text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          {isEditingProfile ? (
            <input
              type="text"
              value={profileData.department || ''}
              onChange={(e) => setProfileData({...profileData, department: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter department"
            />
          ) : (
            <p className="text-gray-900 font-medium">{user.department || 'Not specified'}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
          {isEditingProfile ? (
            <input
              type="text"
              value={profileData.position || ''}
              onChange={(e) => setProfileData({...profileData, position: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter position"
            />
          ) : (
            <p className="text-gray-900 font-medium">{user.position || 'Not specified'}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      {/* Attendance Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Controls</h2>
        
        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              className="bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all duration-200 font-semibold text-lg flex items-center justify-center"
            >
              <LogIn className="w-6 h-6 mr-3" />
              Check In
            </button>
          ) : (
            <button
              onClick={handleCheckOut}
              disabled={!todayAttendance?.checkIn || !!todayAttendance?.checkOut}
              className="bg-red-600 text-white py-4 px-6 rounded-xl hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all duration-200 font-semibold text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-6 h-6 mr-3" />
              Check Out
            </button>
          )}

          {isCheckedIn && !todayAttendance?.checkOut && (
            <>
              {!isOnBreak && !todayAttendance?.hasUsedBreak ? (
                <button
                  onClick={handleBreakStart}
                  className="bg-orange-600 text-white py-4 px-6 rounded-xl hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 transition-all duration-200 font-semibold text-lg flex items-center justify-center"
                >
                  <Pause className="w-6 h-6 mr-3" />
                  Start Break
                </button>
              ) : isOnBreak ? (
                <button
                  onClick={handleBreakEnd}
                  className="bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold text-lg flex items-center justify-center"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Resume Work
                </button>
              ) : (
                <div className="bg-gray-100 text-gray-500 py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center cursor-not-allowed">
                  <Coffee className="w-6 h-6 mr-3" />
                  Break Used Today
                </div>
              )}
            </>
          )}
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Check In</p>
                <p className="text-lg font-bold text-green-800">
                  {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : '--:--'}
                </p>
              </div>
              <LogIn className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Check Out</p>
                <p className="text-lg font-bold text-red-800">
                  {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : '--:--'}
                </p>
              </div>
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Hours Worked</p>
                <p className="text-lg font-bold text-blue-800">
                  {todayAttendance?.checkIn ? 
                    (todayAttendance.checkOut ? 
                      todayAttendance.hoursWorked.toFixed(2) : 
                      (calculateHoursWorked(new Date(todayAttendance.checkIn)) - (todayAttendance.totalBreakTime / 60)).toFixed(2)
                    ) : '0.00'
                  }h
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Break Time</p>
                <p className="text-lg font-bold text-orange-800">
                  {todayAttendance ? 
                    (todayAttendance.isOnBreak && todayAttendance.breakStart ? 
                      (todayAttendance.totalBreakTime + calculateBreakTime(new Date(todayAttendance.breakStart))).toFixed(0) :
                      todayAttendance.totalBreakTime.toFixed(0)
                    ) : '0'
                  }m
                </p>
              </div>
              <Coffee className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">My Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours Worked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Break Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatShortDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkIn ? formatTime(record.checkIn) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkOut ? formatTime(record.checkOut) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.hoursWorked.toFixed(2)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.totalBreakTime.toFixed(0)}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.isOnBreak ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ☕ On Break
                      </span>
                    ) : record.checkIn && record.checkOut ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Complete
                      </span>
                    ) : record.checkIn ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⏳ In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ❌ Absent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendanceHistory.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No attendance records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLeaveRequests = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Leave Requests</h2>
          <button
            onClick={() => setShowLeaveForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </button>
        </div>

        {showLeaveForm && (
          <form onSubmit={handleLeaveSubmit} className="mb-6 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Leave Request</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                <div className="relative">
                  <select
                    value={leaveFormData.type}
                    onChange={(e) => setLeaveFormData({...leaveFormData, type: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={leaveFormData.startDate}
                  onChange={(e) => setLeaveFormData({...leaveFormData, startDate: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={leaveFormData.endDate}
                  onChange={(e) => setLeaveFormData({...leaveFormData, endDate: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({...leaveFormData, reason: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter reason for leave"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 capitalize">{request.type} Leave</h4>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {formatShortDate(request.startDate)} - {formatShortDate(request.endDate)}
              </div>
              {request.adminComment && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Admin Comment:</p>
                  <p className="text-sm text-gray-600 mt-1">{request.adminComment}</p>
                  {request.reviewedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Reviewed on {formatShortDate(request.reviewedAt.toString())}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          {leaveRequests.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No leave requests found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompOff = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comp Off Requests</h2>
            <p className="text-gray-600 mt-1">Request compensatory time off for work done on non-working days</p>
          </div>
          <button
            onClick={() => setShowCompOffForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </button>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Comp Off Guidelines</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Comp off is for work done on weekends (Saturday/Sunday) or holidays</li>
                <li>• Work date must be a non-working day when you actually worked</li>
                <li>• Comp off date should be when you want to take the compensatory leave</li>
                <li>• Both dates cannot be in the future for work date</li>
              </ul>
            </div>
          </div>
        </div>

        {showCompOffForm && (
          <form onSubmit={handleCompOffSubmit} className="mb-6 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Comp Off Request</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={compOffFormData.workDate}
                  onChange={(e) => setCompOffFormData({...compOffFormData, workDate: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select the non-working day when you actually worked
                </p>
                {compOffFormData.workDate && (
                  <div className="mt-2">
                    {(() => {
                      const validation = validateWorkDate(compOffFormData.workDate);
                      return (
                        <div className={`text-xs flex items-center ${
                          validation.isValid ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {validation.isValid ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {validation.message || `${getDayOfWeek(compOffFormData.workDate)} - ${
                            isWeekend(compOffFormData.workDate) ? 'Weekend' : 'Weekday'
                          }`}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comp Off Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={compOffFormData.compOffDate}
                  onChange={(e) => setCompOffFormData({...compOffFormData, compOffDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select when you want to take the compensatory leave
                </p>
                {compOffFormData.compOffDate && (
                  <div className="mt-2 text-xs text-blue-600 flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {getDayOfWeek(compOffFormData.compOffDate)} - Comp off day
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={compOffFormData.reason}
                  onChange={(e) => setCompOffFormData({...compOffFormData, reason: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the work you did on the non-working day (e.g., 'Worked on urgent project delivery during weekend', 'Emergency system maintenance on Sunday')"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={compOffFormData.workDate && !validateWorkDate(compOffFormData.workDate).isValid}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCompOffForm(false);
                  setCompOffFormData({ workDate: '', compOffDate: '', reason: '' });
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {compOffRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">Comp Off Request</h4>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{request.reason}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center text-gray-500">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <div>
                    <span className="font-medium">Work Date:</span>
                    <div className="text-gray-700">
                      {formatShortDate(request.workDate)} ({getDayOfWeek(request.workDate)})
                      {isWeekend(request.workDate) && (
                        <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Weekend</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-gray-500">
                  <Coffee className="w-4 h-4 mr-2" />
                  <div>
                    <span className="font-medium">Comp Off Date:</span>
                    <div className="text-gray-700">
                      {formatShortDate(request.compOffDate)} ({getDayOfWeek(request.compOffDate)})
                    </div>
                  </div>
                </div>
              </div>
              {request.adminComment && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Admin Comment:</p>
                  <p className="text-sm text-gray-600 mt-1">{request.adminComment}</p>
                  {request.reviewedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Reviewed on {formatShortDate(request.reviewedAt.toString())}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          {compOffRequests.length === 0 && (
            <div className="text-center py-8">
              <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No comp off requests found</p>
              <p className="text-gray-400 text-sm mt-2">
                Submit a request when you work on weekends or holidays
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'calendar': return <Calendar user={user} isAdmin={false} />;
      case 'profile': return renderProfile();
      case 'attendance': return renderAttendance();
      case 'leave': return renderLeaveRequests();
      case 'compoff': return renderCompOff();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">AttendanceFlow</h1>
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
                          ? 'bg-blue-600 text-white'
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

export default EmployeeDashboard;