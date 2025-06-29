import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  Save,
  AlertCircle,
  Info,
  Users,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Holiday, Employee, AttendanceRecord, LeaveRequest, CompOffRequest } from '../types';
import { storage } from '../utils/storage';

interface CalendarProps {
  user: Employee;
  isAdmin?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ user, isAdmin = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [compOffRequests, setCompOffRequests] = useState<CompOffRequest[]>([]);
  
  // Holiday management states
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [holidayFormData, setHolidayFormData] = useState({
    name: '',
    date: '',
    type: 'company' as const,
    description: '',
    isOptional: false
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateDetails, setShowDateDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setHolidays(storage.getHolidays());
    if (isAdmin) {
      setEmployees(storage.getEmployees().filter(emp => emp.role === 'employee'));
      setAttendanceRecords(storage.getAttendanceRecords());
      setLeaveRequests(storage.getLeaveRequests());
      setCompOffRequests(storage.getCompOffRequests());
    } else {
      setAttendanceRecords(storage.getEmployeeAttendance(user.id));
      setLeaveRequests(storage.getEmployeeLeaveRequests(user.id));
      setCompOffRequests(storage.getEmployeeCompOffRequests(user.id));
    }
  };

  // Helper function to format date consistently
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to parse date string consistently
  const parseDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date: formatDateString(prevDate),
        day: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isWeekend: prevDate.getDay() === 0 || prevDate.getDay() === 6
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const dateString = formatDateString(currentDay);
      const today = formatDateString(new Date());
      
      days.push({
        date: dateString,
        day,
        isCurrentMonth: true,
        isToday: dateString === today,
        isWeekend: currentDay.getDay() === 0 || currentDay.getDay() === 6
      });
    }

    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - days.length; // 6 rows × 7 days = 42 cells
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: formatDateString(nextDate),
        day: nextDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getHolidayForDate = (date: string): Holiday | null => {
    return holidays.find(h => h.date === date) || null;
  };

  const getAttendanceForDate = (date: string, employeeId?: string) => {
    if (isAdmin && !employeeId) {
      return attendanceRecords.filter(r => r.date === date);
    }
    return attendanceRecords.filter(r => r.date === date && r.employeeId === (employeeId || user.id));
  };

  const getLeaveForDate = (date: string, employeeId?: string) => {
    const targetId = employeeId || user.id;
    return leaveRequests.filter(leave => 
      leave.employeeId === targetId &&
      leave.startDate <= date && 
      leave.endDate >= date && 
      leave.status === 'approved'
    );
  };

  const getCompOffForDate = (date: string, employeeId?: string) => {
    const targetId = employeeId || user.id;
    return compOffRequests.filter(compOff => 
      compOff.employeeId === targetId &&
      compOff.compOffDate === date && 
      compOff.status === 'approved'
    );
  };

  const getDayStatus = (date: string, employeeId?: string) => {
    const holiday = getHolidayForDate(date);
    const attendance = getAttendanceForDate(date, employeeId);
    const leaves = getLeaveForDate(date, employeeId);
    const compOffs = getCompOffForDate(date, employeeId);

    if (holiday) return { type: 'holiday', data: holiday };
    if (compOffs.length > 0) return { type: 'compoff', data: compOffs[0] };
    if (leaves.length > 0) return { type: 'leave', data: leaves[0] };
    if (attendance.length > 0) return { type: 'present', data: attendance[0] };
    
    const dayDate = parseDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dayDate.setHours(0, 0, 0, 0);
    
    if (dayDate < today) return { type: 'absent', data: null };
    
    return { type: 'future', data: null };
  };

  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const holiday: Holiday = {
      id: editingHoliday?.id || `holiday-${Date.now()}`,
      name: holidayFormData.name,
      date: holidayFormData.date,
      type: holidayFormData.type,
      description: holidayFormData.description,
      isOptional: holidayFormData.isOptional,
      createdBy: user.id,
      createdAt: new Date()
    };

    storage.saveHoliday(holiday);
    loadData();
    resetHolidayForm();
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      description: holiday.description || '',
      isOptional: holiday.isOptional || false
    });
    setShowHolidayForm(true);
  };

  const handleDeleteHoliday = (holidayId: string) => {
    if (confirm('Are you sure you want to delete this holiday?')) {
      storage.deleteHoliday(holidayId);
      loadData();
    }
  };

  const resetHolidayForm = () => {
    setShowHolidayForm(false);
    setEditingHoliday(null);
    setHolidayFormData({
      name: '',
      date: '',
      type: 'company',
      description: '',
      isOptional: false
    });
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setShowDateDetails(true);
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'holiday': return 'bg-red-100 text-red-800 border-red-200';
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'leave': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'compoff': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'absent': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-white text-gray-400 border-gray-100';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'holiday': return '🎉';
      case 'present': return '✅';
      case 'leave': return '📋';
      case 'compoff': return '☕';
      case 'absent': return '❌';
      default: return '';
    }
  };

  const formatDate = (date: string) => {
    const parsedDate = parseDate(date);
    return parsedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date: string) => {
    const parsedDate = parseDate(date);
    return parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = getDaysInMonth(currentDate);

  // Get holidays for the current year to display in the holiday list
  const currentYearHolidays = holidays
    .filter(holiday => holiday.date.startsWith(currentDate.getFullYear().toString()))
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isAdmin ? 'Attendance Calendar' : 'My Calendar'}
            </h2>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowHolidayForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Holiday
            </button>
          )}
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
            >
              Today
            </button>
          </div>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-lg">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {days.map((day, index) => {
            const status = getDayStatus(day.date, isAdmin ? undefined : user.id);
            const holiday = getHolidayForDate(day.date);
            
            return (
              <div
                key={index}
                onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                className={`
                  min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                  ${day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                  ${day.isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                  ${day.isWeekend && day.isCurrentMonth ? 'bg-gray-50' : ''}
                  ${holiday ? 'bg-red-50 border-red-200' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`
                    text-sm font-medium
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${day.isToday ? 'text-blue-600 font-bold' : ''}
                    ${holiday ? 'text-red-700' : ''}
                  `}>
                    {day.day}
                  </span>
                  {holiday && (
                    <span className="text-xs">🎉</span>
                  )}
                </div>

                {day.isCurrentMonth && (
                  <div className="space-y-1">
                    {/* Holiday indicator */}
                    {holiday && (
                      <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded truncate border border-red-200">
                        {holiday.name}
                      </div>
                    )}

                    {/* Attendance status for admin view */}
                    {isAdmin && !holiday && (
                      <div className="space-y-1">
                        {employees.slice(0, 3).map(employee => {
                          const empStatus = getDayStatus(day.date, employee.id);
                          return (
                            <div key={employee.id} className="text-xs flex items-center gap-1">
                              <span className="text-xs">{getStatusIcon(empStatus.type)}</span>
                              <span className="truncate">{employee.name.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                        {employees.length > 3 && (
                          <div className="text-xs text-gray-500">+{employees.length - 3} more</div>
                        )}
                      </div>
                    )}

                    {/* Personal status for employee view */}
                    {!isAdmin && !holiday && (
                      <div className={`text-xs px-2 py-1 rounded border ${getStatusColor(status.type)}`}>
                        <span className="mr-1">{getStatusIcon(status.type)}</span>
                        {status.type === 'present' && status.data ? 'Present' :
                         status.type === 'leave' ? 'On Leave' :
                         status.type === 'compoff' ? 'Comp Off' :
                         status.type === 'absent' ? 'Absent' : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holiday List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Holidays {currentDate.getFullYear()}
          </h3>
          <div className="text-sm text-gray-500">
            {currentYearHolidays.length} holiday{currentYearHolidays.length !== 1 ? 's' : ''} this year
          </div>
        </div>

        {currentYearHolidays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentYearHolidays.map(holiday => (
              <div key={holiday.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🎉</span>
                      <h4 className="font-semibold text-gray-900">{holiday.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{formatDate(holiday.date)}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleEditHoliday(holiday)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                        title="Edit Holiday"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    holiday.type === 'national' ? 'bg-red-100 text-red-800 border border-red-200' :
                    holiday.type === 'regional' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                  </span>
                  {holiday.isOptional && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200 font-medium">
                      Optional
                    </span>
                  )}
                </div>
                
                {holiday.description && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{holiday.description}</p>
                )}

                {/* Show days remaining/passed */}
                {(() => {
                  const today = new Date();
                  const holidayDate = parseDate(holiday.date);
                  const diffTime = holidayDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        {diffDays > 0 ? (
                          <span className="text-blue-600 font-medium">
                            {diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`}
                          </span>
                        ) : diffDays === 0 ? (
                          <span className="text-green-600 font-medium">Today</span>
                        ) : (
                          <span className="text-gray-500">
                            {Math.abs(diffDays) === 1 ? 'Yesterday' : `${Math.abs(diffDays)} days ago`}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No holidays found for {currentDate.getFullYear()}</p>
            {isAdmin && (
              <p className="text-gray-400 text-sm mt-2">
                Click "Add Holiday" to create new holidays for your organization
              </p>
            )}
          </div>
        )}
      </div>

      {/* Holiday Form Modal */}
      {showHolidayForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
            </h3>
            
            <form onSubmit={handleHolidaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Name</label>
                <input
                  type="text"
                  value={holidayFormData.name}
                  onChange={(e) => setHolidayFormData({...holidayFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter holiday name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={holidayFormData.date}
                  onChange={(e) => setHolidayFormData({...holidayFormData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={holidayFormData.type}
                  onChange={(e) => setHolidayFormData({...holidayFormData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="national">National</option>
                  <option value="regional">Regional</option>
                  <option value="company">Company</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={holidayFormData.description}
                  onChange={(e) => setHolidayFormData({...holidayFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter holiday description"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isOptional"
                  checked={holidayFormData.isOptional}
                  onChange={(e) => setHolidayFormData({...holidayFormData, isOptional: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isOptional" className="ml-2 text-sm text-gray-700">
                  Optional Holiday
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  {editingHoliday ? 'Update' : 'Add'} Holiday
                </button>
                <button
                  type="button"
                  onClick={resetHolidayForm}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date Details Modal */}
      {showDateDetails && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {formatDate(selectedDate)}
              </h3>
              <button
                onClick={() => setShowDateDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Holiday info */}
              {getHolidayForDate(selectedDate) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <span className="text-lg">🎉</span>
                    Holiday
                  </h4>
                  <p className="text-red-800 font-medium">{getHolidayForDate(selectedDate)?.name}</p>
                  {getHolidayForDate(selectedDate)?.description && (
                    <p className="text-red-700 text-sm mt-1">{getHolidayForDate(selectedDate)?.description}</p>
                  )}
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      getHolidayForDate(selectedDate)?.type === 'national' ? 'bg-red-100 text-red-800' :
                      getHolidayForDate(selectedDate)?.type === 'regional' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {getHolidayForDate(selectedDate)?.type?.charAt(0).toUpperCase() + getHolidayForDate(selectedDate)?.type?.slice(1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Attendance details */}
              {isAdmin ? (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Employee Attendance</h4>
                  <div className="space-y-2">
                    {employees.map(employee => {
                      const status = getDayStatus(selectedDate, employee.id);
                      const attendance = getAttendanceForDate(selectedDate, employee.id)[0];
                      
                      return (
                        <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{employee.name}</p>
                              <p className="text-sm text-gray-500">{employee.employeeId}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status.type)}`}>
                              <span className="mr-1">{getStatusIcon(status.type)}</span>
                              {status.type === 'present' ? 'Present' :
                               status.type === 'leave' ? 'On Leave' :
                               status.type === 'compoff' ? 'Comp Off' :
                               status.type === 'absent' ? 'Absent' :
                               status.type === 'holiday' ? 'Holiday' : 'Future'}
                            </div>
                            {attendance && (
                              <div className="text-xs text-gray-500 mt-1">
                                {attendance.checkIn && `In: ${formatTime(attendance.checkIn)}`}
                                {attendance.checkOut && ` | Out: ${formatTime(attendance.checkOut)}`}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">My Attendance</h4>
                  {(() => {
                    const status = getDayStatus(selectedDate, user.id);
                    const attendance = getAttendanceForDate(selectedDate, user.id)[0];
                    
                    return (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStatusColor(status.type)}`}>
                          <span className="mr-2">{getStatusIcon(status.type)}</span>
                          {status.type === 'present' ? 'Present' :
                           status.type === 'leave' ? 'On Leave' :
                           status.type === 'compoff' ? 'Comp Off' :
                           status.type === 'absent' ? 'Absent' :
                           status.type === 'holiday' ? 'Holiday' : 'Future'}
                        </div>
                        {attendance && (
                          <div className="mt-3 space-y-2">
                            {attendance.checkIn && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Check In: {formatTime(attendance.checkIn)}</span>
                              </div>
                            )}
                            {attendance.checkOut && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>Check Out: {formatTime(attendance.checkOut)}</span>
                              </div>
                            )}
                            {attendance.hoursWorked > 0 && (
                              <div className="text-sm text-gray-600">
                                Hours Worked: {attendance.hoursWorked.toFixed(2)}h
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;