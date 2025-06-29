/*
  # Attendance Management System Database Schema

  This migration creates all the necessary tables for the attendance management system.

  ## Tables Created:
  1. employees - Extended employee information
  2. attendance_records - Daily attendance tracking
  3. leave_requests - Employee leave applications
  4. comp_off_requests - Compensatory time off requests
  5. holidays - Company/national holidays
  6. notifications - System notifications
  7. profile_change_requests - Employee profile update requests
  8. documents - Employee document storage info

  ## Security:
  - RLS enabled on all tables
  - Policies for authenticated users based on roles
*/

-- Create employees table (extends the existing User table)
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  phone text,
  department text,
  position text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  joining_date date,
  salary numeric,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Address information
  address_street text,
  address_city text,
  address_state text,
  address_pincode text,
  address_country text DEFAULT 'India',
  
  -- Emergency contact
  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  
  -- Bank details
  bank_account_number text,
  bank_ifsc_code text,
  bank_name text,
  bank_account_holder_name text,
  
  -- Verification status
  verification_documents_status text DEFAULT 'pending' CHECK (verification_documents_status IN ('pending', 'verified', 'rejected')),
  verification_profile_status text DEFAULT 'pending' CHECK (verification_profile_status IN ('pending', 'verified', 'rejected'))
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  hours_worked numeric DEFAULT 0,
  break_start timestamptz,
  break_end timestamptz,
  total_break_time numeric DEFAULT 0,
  is_on_break boolean DEFAULT false,
  has_used_break boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(employee_id, date)
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('sick', 'vacation', 'personal', 'emergency')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_date timestamptz DEFAULT now(),
  admin_comment text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comp_off_requests table
CREATE TABLE IF NOT EXISTS comp_off_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  comp_off_date date NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_date timestamptz DEFAULT now(),
  admin_comment text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('national', 'regional', 'company')),
  description text,
  is_optional boolean DEFAULT false,
  created_by uuid REFERENCES employees(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(date, name)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('leave_request', 'compoff_request', 'leave_approved', 'leave_rejected', 'compoff_approved', 'compoff_rejected', 'profile_change_request')),
  title text NOT NULL,
  message text NOT NULL,
  recipient_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  related_id uuid, -- ID of the related request
  is_read boolean DEFAULT false,
  data jsonb, -- Additional data for the notification
  created_at timestamptz DEFAULT now()
);

-- Create profile_change_requests table
CREATE TABLE IF NOT EXISTS profile_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value text,
  new_value text,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_date timestamptz DEFAULT now(),
  admin_comment text,
  reviewed_by uuid REFERENCES employees(id),
  reviewed_at timestamptz,
  supporting_document_info jsonb, -- Document information if any
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('aadhaar', 'pan', 'passport', 'driving_license', 'voter_card', 'education_certificate', 'experience_letter', 'salary_slip')),
  file_name text NOT NULL,
  file_url text, -- URL to the stored file
  document_number text,
  expiry_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  upload_date timestamptz DEFAULT now(),
  admin_comment text,
  verified_by uuid REFERENCES employees(id),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(employee_id, document_type)
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for employees table
CREATE POLICY "Users can read own employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all employee data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all employee data"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own employee data"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for attendance_records table
CREATE POLICY "Users can read own attendance records"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can read all attendance records"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own attendance records"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own attendance records"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid());

-- Create policies for leave_requests table
CREATE POLICY "Users can read own leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can read all leave requests"
  ON leave_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own leave requests"
  ON leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can update leave requests"
  ON leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for comp_off_requests table
CREATE POLICY "Users can read own comp off requests"
  ON comp_off_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can read all comp off requests"
  ON comp_off_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own comp off requests"
  ON comp_off_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can update comp off requests"
  ON comp_off_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for holidays table
CREATE POLICY "All authenticated users can read holidays"
  ON holidays
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage holidays"
  ON holidays
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for notifications table
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Create policies for profile_change_requests table
CREATE POLICY "Users can read own profile change requests"
  ON profile_change_requests
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can read all profile change requests"
  ON profile_change_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own profile change requests"
  ON profile_change_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can update profile change requests"
  ON profile_change_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for documents table
CREATE POLICY "Users can read own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can read all documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY "Admins can update all documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status ON leave_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_comp_off_requests_employee_status ON comp_off_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profile_change_requests_employee_status ON profile_change_requests(employee_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_employee_type ON documents(employee_id, document_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comp_off_requests_updated_at BEFORE UPDATE ON comp_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profile_change_requests_updated_at BEFORE UPDATE ON profile_change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default holidays for current year
INSERT INTO holidays (name, date, type, description, is_optional) VALUES
  ('Republic Day', CURRENT_DATE - EXTRACT(DOY FROM CURRENT_DATE)::int + 26, 'national', 'National holiday celebrating the adoption of the Constitution of India', false),
  ('Independence Day', CURRENT_DATE - EXTRACT(DOY FROM CURRENT_DATE)::int + 227, 'national', 'National holiday celebrating India''s independence from British rule', false),
  ('Gandhi Jayanti', CURRENT_DATE - EXTRACT(DOY FROM CURRENT_DATE)::int + 275, 'national', 'National holiday celebrating the birth of Mahatma Gandhi', false),
  ('Christmas', CURRENT_DATE - EXTRACT(DOY FROM CURRENT_DATE)::int + 359, 'national', 'Christian festival celebrating the birth of Jesus Christ', false)
ON CONFLICT (date, name) DO NOTHING;