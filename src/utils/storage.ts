import { Employee, AttendanceRecord, LeaveRequest, CompOffRequest, ProfileChangeRequest, Holiday, Notification } from '../types';

export const storage = {
  // Employee management
  saveEmployee: (employee: Employee) => {
    const employees = storage.getEmployees();
    employees.push(employee);
    localStorage.setItem('employees', JSON.stringify(employees));
  },

  getEmployees: (): Employee[] => {
    const stored = localStorage.getItem('employees');
    return stored ? JSON.parse(stored) : [];
  },

  findEmployee: (email: string, password: string): Employee | null => {
    const employees = storage.getEmployees();
    return employees.find(emp => emp.email === email && emp.password === password) || null;
  },

  updateEmployee: (employee: Employee) => {
    const employees = storage.getEmployees();
    const index = employees.findIndex(emp => emp.id === employee.id);
    if (index >= 0) {
      employees[index] = employee;
      localStorage.setItem('employees', JSON.stringify(employees));
    }
  },

  // Attendance management
  saveAttendance: (record: AttendanceRecord) => {
    const records = storage.getAttendanceRecords();
    const existingIndex = records.findIndex(r => r.employeeId === record.employeeId && r.date === record.date);
    
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    localStorage.setItem('attendance', JSON.stringify(records));
  },

  getAttendanceRecords: (): AttendanceRecord[] => {
    const stored = localStorage.getItem('attendance');
    const records = stored ? JSON.parse(stored) : [];
    
    // Migrate old records to include break fields
    return records.map((record: any) => ({
      ...record,
      totalBreakTime: record.totalBreakTime || 0,
      isOnBreak: record.isOnBreak || false,
      hasUsedBreak: record.hasUsedBreak || false,
      breakStart: record.breakStart || null,
      breakEnd: record.breakEnd || null
    }));
  },

  getTodayAttendance: (employeeId: string): AttendanceRecord | null => {
    const today = new Date().toISOString().split('T')[0];
    const records = storage.getAttendanceRecords();
    return records.find(r => r.employeeId === employeeId && r.date === today) || null;
  },

  getEmployeeAttendance: (employeeId: string): AttendanceRecord[] => {
    const records = storage.getAttendanceRecords();
    return records.filter(r => r.employeeId === employeeId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getAttendanceByDateRange: (startDate: string, endDate: string): AttendanceRecord[] => {
    const records = storage.getAttendanceRecords();
    return records.filter(r => r.date >= startDate && r.date <= endDate);
  },

  getAttendanceByDate: (date: string): AttendanceRecord[] => {
    const records = storage.getAttendanceRecords();
    return records.filter(r => r.date === date);
  },

  // Leave Request management
  saveLeaveRequest: (request: LeaveRequest) => {
    const requests = storage.getLeaveRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex >= 0) {
      requests[existingIndex] = request;
    } else {
      requests.push(request);
    }
    
    localStorage.setItem('leaveRequests', JSON.stringify(requests));
  },

  getLeaveRequests: (): LeaveRequest[] => {
    const stored = localStorage.getItem('leaveRequests');
    return stored ? JSON.parse(stored) : [];
  },

  getEmployeeLeaveRequests: (employeeId: string): LeaveRequest[] => {
    const requests = storage.getLeaveRequests();
    return requests.filter(r => r.employeeId === employeeId).sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
  },

  getLeavesByDateRange: (startDate: string, endDate: string): LeaveRequest[] => {
    const requests = storage.getLeaveRequests();
    return requests.filter(r => {
      return (r.startDate <= endDate && r.endDate >= startDate) && r.status === 'approved';
    });
  },

  getLeavesByDate: (date: string): LeaveRequest[] => {
    const requests = storage.getLeaveRequests();
    return requests.filter(r => {
      return r.startDate <= date && r.endDate >= date && r.status === 'approved';
    });
  },

  // Comp Off Request management
  saveCompOffRequest: (request: CompOffRequest) => {
    const requests = storage.getCompOffRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex >= 0) {
      requests[existingIndex] = request;
    } else {
      requests.push(request);
    }
    
    localStorage.setItem('compOffRequests', JSON.stringify(requests));
  },

  getCompOffRequests: (): CompOffRequest[] => {
    const stored = localStorage.getItem('compOffRequests');
    return stored ? JSON.parse(stored) : [];
  },

  getEmployeeCompOffRequests: (employeeId: string): CompOffRequest[] => {
    const requests = storage.getCompOffRequests();
    return requests.filter(r => r.employeeId === employeeId).sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
  },

  getCompOffsByDateRange: (startDate: string, endDate: string): CompOffRequest[] => {
    const requests = storage.getCompOffRequests();
    return requests.filter(r => {
      return r.compOffDate >= startDate && r.compOffDate <= endDate && r.status === 'approved';
    });
  },

  getCompOffsByDate: (date: string): CompOffRequest[] => {
    const requests = storage.getCompOffRequests();
    return requests.filter(r => {
      return r.compOffDate === date && r.status === 'approved';
    });
  },

  // Profile Change Request management
  saveProfileChangeRequest: (request: ProfileChangeRequest) => {
    const requests = storage.getProfileChangeRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex >= 0) {
      requests[existingIndex] = request;
    } else {
      requests.push(request);
    }
    
    localStorage.setItem('profileChangeRequests', JSON.stringify(requests));
  },

  getProfileChangeRequests: (): ProfileChangeRequest[] => {
    const stored = localStorage.getItem('profileChangeRequests');
    return stored ? JSON.parse(stored) : [];
  },

  getEmployeeProfileChangeRequests: (employeeId: string): ProfileChangeRequest[] => {
    const requests = storage.getProfileChangeRequests();
    return requests.filter(r => r.employeeId === employeeId).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  },

  // Holiday management
  saveHoliday: (holiday: Holiday) => {
    const holidays = storage.getHolidays();
    const existingIndex = holidays.findIndex(h => h.id === holiday.id);
    
    if (existingIndex >= 0) {
      holidays[existingIndex] = holiday;
    } else {
      holidays.push(holiday);
    }
    
    localStorage.setItem('holidays', JSON.stringify(holidays));
  },

  getHolidays: (): Holiday[] => {
    const stored = localStorage.getItem('holidays');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Initialize with default Indian holidays for current year
    const currentYear = new Date().getFullYear();
    const defaultHolidays: Holiday[] = [
      {
        id: 'republic-day',
        name: 'Republic Day',
        date: `${currentYear}-01-26`,
        type: 'national',
        description: 'National holiday celebrating the adoption of the Constitution of India',
        isOptional: false
      },
      {
        id: 'independence-day',
        name: 'Independence Day',
        date: `${currentYear}-08-15`,
        type: 'national',
        description: 'National holiday celebrating India\'s independence from British rule',
        isOptional: false
      },
      {
        id: 'gandhi-jayanti',
        name: 'Gandhi Jayanti',
        date: `${currentYear}-10-02`,
        type: 'national',
        description: 'National holiday celebrating the birth of Mahatma Gandhi',
        isOptional: false
      },
      {
        id: 'holi',
        name: 'Holi',
        date: `${currentYear}-03-13`,
        type: 'national',
        description: 'Festival of colors',
        isOptional: false
      },
      {
        id: 'diwali',
        name: 'Diwali',
        date: `${currentYear}-11-12`,
        type: 'national',
        description: 'Festival of lights',
        isOptional: false
      },
      {
        id: 'dussehra',
        name: 'Dussehra',
        date: `${currentYear}-10-24`,
        type: 'national',
        description: 'Victory of good over evil',
        isOptional: false
      },
      {
        id: 'eid-ul-fitr',
        name: 'Eid ul-Fitr',
        date: `${currentYear}-04-21`,
        type: 'national',
        description: 'Festival marking the end of Ramadan',
        isOptional: false
      },
      {
        id: 'christmas',
        name: 'Christmas',
        date: `${currentYear}-12-25`,
        type: 'national',
        description: 'Christian festival celebrating the birth of Jesus Christ',
        isOptional: false
      }
    ];
    
    localStorage.setItem('holidays', JSON.stringify(defaultHolidays));
    return defaultHolidays;
  },

  deleteHoliday: (holidayId: string) => {
    const holidays = storage.getHolidays();
    const filteredHolidays = holidays.filter(h => h.id !== holidayId);
    localStorage.setItem('holidays', JSON.stringify(filteredHolidays));
  },

  getHolidayByDate: (date: string): Holiday | null => {
    const holidays = storage.getHolidays();
    return holidays.find(h => h.date === date) || null;
  },

  getHolidaysByDateRange: (startDate: string, endDate: string): Holiday[] => {
    const holidays = storage.getHolidays();
    return holidays.filter(h => h.date >= startDate && h.date <= endDate);
  },

  // Notification management
  saveNotification: (notification: Notification) => {
    const notifications = storage.getNotifications();
    notifications.push(notification);
    localStorage.setItem('notifications', JSON.stringify(notifications));
  },

  getNotifications: (): Notification[] => {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  },

  getUserNotifications: (userId: string): Notification[] => {
    const notifications = storage.getNotifications();
    return notifications
      .filter(n => n.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadNotificationCount: (userId: string): number => {
    const notifications = storage.getUserNotifications(userId);
    return notifications.filter(n => !n.isRead).length;
  },

  markNotificationAsRead: (notificationId: string) => {
    const notifications = storage.getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index >= 0) {
      notifications[index].isRead = true;
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  },

  markAllNotificationsAsRead: (userId: string) => {
    const notifications = storage.getNotifications();
    const updated = notifications.map(n => 
      n.recipientId === userId ? { ...n, isRead: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
  },

  deleteNotification: (notificationId: string) => {
    const notifications = storage.getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('notifications', JSON.stringify(filtered));
  },

  // Helper function to create notifications
  createNotification: (
    type: Notification['type'],
    title: string,
    message: string,
    recipientId: string,
    senderId: string,
    relatedId: string,
    data?: any
  ) => {
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      recipientId,
      senderId,
      relatedId,
      isRead: false,
      createdAt: new Date(),
      data
    };
    storage.saveNotification(notification);
    return notification;
  },

  // Session management
  setCurrentUser: (user: Employee) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
  },

  getCurrentUser: (): Employee | null => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  },

  clearCurrentUser: () => {
    localStorage.removeItem('currentUser');
  }
};