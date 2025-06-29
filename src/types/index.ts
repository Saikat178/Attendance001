export interface Employee {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  password: string;
  photo?: string;
  role: 'employee' | 'admin';
  createdAt: Date;
  department?: string;
  position?: string;
  phone?: string;
  // Personal Information
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  // Emergency Contact
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  // Employment Details
  joiningDate?: string;
  salary?: number;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    accountHolderName: string;
  };
  // Document Status
  documents?: {
    aadhaar?: DocumentInfo;
    pan?: DocumentInfo;
    passport?: DocumentInfo;
    drivingLicense?: DocumentInfo;
    voterCard?: DocumentInfo;
    educationCertificate?: DocumentInfo;
    experienceLetter?: DocumentInfo;
    salarySlip?: DocumentInfo;
  };
  // Profile Change Requests
  profileChangeRequests?: ProfileChangeRequest[];
  // Verification Status
  isVerified?: boolean;
  verificationStatus?: {
    documents: 'pending' | 'verified' | 'rejected';
    profile: 'pending' | 'verified' | 'rejected';
  };
}

export interface DocumentInfo {
  fileName: string;
  uploadDate: Date;
  status: 'pending' | 'verified' | 'rejected';
  documentNumber?: string;
  expiryDate?: string;
  adminComment?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface ProfileChangeRequest {
  id: string;
  employeeId: string;
  field: string;
  oldValue: any;
  newValue: any;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  adminComment?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  supportingDocument?: DocumentInfo;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  checkIn?: Date;
  checkOut?: Date;
  date: string;
  hoursWorked: number;
  breakStart?: Date;
  breakEnd?: Date;
  totalBreakTime: number;
  isOnBreak: boolean;
  hasUsedBreak: boolean; // New field to track if break was used
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'sick' | 'vacation' | 'personal' | 'emergency';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: Date;
  adminComment?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface CompOffRequest {
  id: string;
  employeeId: string;
  workDate: string;
  compOffDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: Date;
  adminComment?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  onCompOffToday: number;
  onBreakToday: number;
  attendanceRate: number;
}

export interface AppState {
  currentUser: Employee | null;
  currentPage: 'landing' | 'login' | 'signup' | 'employee-dashboard' | 'admin-dashboard';
  showConfirmation: boolean;
  confirmationMessage: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'regional' | 'company';
  description?: string;
  isOptional?: boolean;
  createdBy?: string;
  createdAt?: Date;
}

export interface CalendarDay {
  date: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holiday?: Holiday;
  attendanceData: {
    [employeeId: string]: {
      status: 'present' | 'absent' | 'leave' | 'compoff' | 'holiday';
      checkIn?: string;
      checkOut?: string;
      hoursWorked?: number;
      leaveType?: string;
    };
  };
}

export interface Notification {
  id: string;
  type: 'leave_request' | 'compoff_request' | 'leave_approved' | 'leave_rejected' | 'compoff_approved' | 'compoff_rejected' | 'profile_change_request';
  title: string;
  message: string;
  recipientId: string;
  senderId: string;
  relatedId: string; // ID of the related request
  isRead: boolean;
  createdAt: Date;
  data?: any; // Additional data for the notification
}