/**
 * Comprehensive validation utilities for the attendance management system
 */

// Input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 255); // Limit length
};

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long' };
  }
  
  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password is too long (max 128 characters)');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Phone number validation
export const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: true }; // Phone is optional
  }
  
  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Check for valid international format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  return { isValid: true };
};

// Employee ID validation
export const validateEmployeeId = (employeeId: string): { isValid: boolean; error?: string } => {
  if (!employeeId) {
    return { isValid: false, error: 'Employee ID is required' };
  }
  
  const sanitized = sanitizeInput(employeeId);
  
  if (sanitized.length < 3) {
    return { isValid: false, error: 'Employee ID must be at least 3 characters long' };
  }
  
  if (sanitized.length > 20) {
    return { isValid: false, error: 'Employee ID is too long (max 20 characters)' };
  }
  
  // Allow alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return { isValid: false, error: 'Employee ID can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true };
};

// Name validation
export const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }
  
  const sanitized = sanitizeInput(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (sanitized.length > 100) {
    return { isValid: false, error: 'Name is too long (max 100 characters)' };
  }
  
  // Allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(sanitized)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true };
};

// Date validation
export const validateDate = (date: string, options: {
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  futureOnly?: boolean;
  pastOnly?: boolean;
} = {}): { isValid: boolean; error?: string } => {
  if (!date) {
    return { isValid: !options.required, error: options.required ? 'Date is required' : undefined };
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (options.futureOnly && dateObj <= today) {
    return { isValid: false, error: 'Date must be in the future' };
  }
  
  if (options.pastOnly && dateObj >= today) {
    return { isValid: false, error: 'Date must be in the past' };
  }
  
  if (options.minDate && dateObj < new Date(options.minDate)) {
    return { isValid: false, error: `Date must be after ${options.minDate}` };
  }
  
  if (options.maxDate && dateObj > new Date(options.maxDate)) {
    return { isValid: false, error: `Date must be before ${options.maxDate}` };
  }
  
  return { isValid: true };
};

// Working hours validation
export const validateWorkingHours = (checkIn: Date, checkOut?: Date): { 
  isValid: boolean; 
  error?: string; 
  hoursWorked?: number 
} => {
  if (!checkIn) {
    return { isValid: false, error: 'Check-in time is required' };
  }
  
  if (!checkOut) {
    return { isValid: true }; // Check-out is optional for ongoing work
  }
  
  if (checkOut <= checkIn) {
    return { isValid: false, error: 'Check-out time must be after check-in time' };
  }
  
  const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  
  if (hoursWorked > 24) {
    return { isValid: false, error: 'Working hours cannot exceed 24 hours' };
  }
  
  if (hoursWorked < 0.5) {
    return { isValid: false, error: 'Working hours must be at least 30 minutes' };
  }
  
  return { isValid: true, hoursWorked };
};

// Leave request validation
export const validateLeaveRequest = (data: {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.type) {
    errors.push('Leave type is required');
  }
  
  const startDateValidation = validateDate(data.startDate, { 
    required: true, 
    minDate: new Date().toISOString().split('T')[0] 
  });
  if (!startDateValidation.isValid) {
    errors.push(startDateValidation.error!);
  }
  
  const endDateValidation = validateDate(data.endDate, { 
    required: true, 
    minDate: data.startDate 
  });
  if (!endDateValidation.isValid) {
    errors.push(endDateValidation.error!);
  }
  
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    errors.push('End date must be after start date');
  }
  
  if (!data.reason || sanitizeInput(data.reason).length < 10) {
    errors.push('Reason must be at least 10 characters long');
  }
  
  if (data.reason && sanitizeInput(data.reason).length > 500) {
    errors.push('Reason is too long (max 500 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Comp off request validation
export const validateCompOffRequest = (data: {
  workDate: string;
  compOffDate: string;
  reason: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const workDateValidation = validateDate(data.workDate, { 
    required: true, 
    pastOnly: true 
  });
  if (!workDateValidation.isValid) {
    errors.push(`Work date: ${workDateValidation.error}`);
  }
  
  const compOffDateValidation = validateDate(data.compOffDate, { 
    required: true, 
    futureOnly: true 
  });
  if (!compOffDateValidation.isValid) {
    errors.push(`Comp off date: ${compOffDateValidation.error}`);
  }
  
  if (!data.reason || sanitizeInput(data.reason).length < 10) {
    errors.push('Reason must be at least 10 characters long');
  }
  
  if (data.reason && sanitizeInput(data.reason).length > 500) {
    errors.push('Reason is too long (max 500 characters)');
  }
  
  // Check if work date is a weekend or holiday (basic check)
  if (data.workDate) {
    const workDate = new Date(data.workDate);
    const dayOfWeek = workDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // This is a weekday, might want to warn user
      // Note: In a real app, you'd check against holidays database
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// File upload validation
export const validateFileUpload = (file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}): { isValid: boolean; error?: string } => {
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
  const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'application/pdf'];
  const allowedExtensions = options.allowedExtensions || ['.jpg', '.jpeg', '.png', '.pdf'];
  
  if (!file) {
    return { isValid: false, error: 'File is required' };
  }
  
  if (file.size > maxSize) {
    return { isValid: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }
  
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}` };
  }
  
  return { isValid: true };
};

// Salary validation
export const validateSalary = (salary: number | string): { isValid: boolean; error?: string } => {
  if (!salary) {
    return { isValid: true }; // Salary is optional
  }
  
  const numSalary = typeof salary === 'string' ? parseFloat(salary) : salary;
  
  if (isNaN(numSalary)) {
    return { isValid: false, error: 'Salary must be a valid number' };
  }
  
  if (numSalary < 0) {
    return { isValid: false, error: 'Salary cannot be negative' };
  }
  
  if (numSalary > 10000000) { // 1 crore max
    return { isValid: false, error: 'Salary amount is too high' };
  }
  
  return { isValid: true };
};

// Comprehensive form validation
export const validateForm = (data: Record<string, any>, rules: Record<string, any>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${rule.label || field} is required`;
      continue;
    }
    
    if (value && rule.validator) {
      const validation = rule.validator(value);
      if (!validation.isValid) {
        errors[field] = validation.error || validation.errors?.[0] || 'Invalid value';
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// XSS prevention
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

// SQL injection prevention (for display purposes)
export const escapeSql = (text: string): string => {
  return text.replace(/'/g, "''").replace(/;/g, '');
};