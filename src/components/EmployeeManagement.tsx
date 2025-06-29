import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  CreditCard,
  MapPin,
  AlertCircle,
  X,
  Save
} from 'lucide-react';
import { Employee, DocumentInfo } from '../types';
import { storage } from '../utils/storage';

interface EmployeeManagementProps {
  currentUser: Employee;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ type: string; doc: DocumentInfo } | null>(null);
  const [documentComment, setDocumentComment] = useState('');
  const [documentAction, setDocumentAction] = useState<'verify' | 'reject'>('verify');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    const allEmployees = storage.getEmployees().filter(emp => emp.role === 'employee');
    setEmployees(allEmployees);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'verified':
        return employee.isVerified === true;
      case 'pending':
        return employee.isVerified !== true && employee.isVerified !== false;
      case 'rejected':
        return employee.isVerified === false;
      default:
        return true;
    }
  });

  const handleDocumentUpload = (employeeId: string, documentType: string, file: File) => {
    // In a real application, you would upload the file to a server
    // For this demo, we'll simulate the upload
    const documentInfo: DocumentInfo = {
      fileName: file.name,
      uploadDate: new Date(),
      status: 'pending',
      documentNumber: '', // Would be extracted from the document
      adminComment: '',
      verifiedBy: '',
      verifiedAt: undefined
    };

    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      const updatedEmployee = {
        ...employee,
        documents: {
          ...employee.documents,
          [documentType]: documentInfo
        }
      };
      
      storage.updateEmployee(updatedEmployee);
      loadEmployees();
    }
  };

  const handleDocumentReview = (employeeId: string, documentType: string, action: 'verify' | 'reject', comment: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee && employee.documents && employee.documents[documentType as keyof typeof employee.documents]) {
      const updatedDocument = {
        ...employee.documents[documentType as keyof typeof employee.documents]!,
        status: action === 'verify' ? 'verified' as const : 'rejected' as const,
        adminComment: comment,
        verifiedBy: currentUser.name,
        verifiedAt: new Date()
      };

      const updatedEmployee = {
        ...employee,
        documents: {
          ...employee.documents,
          [documentType]: updatedDocument
        }
      };

      // Check if all required documents are verified
      const requiredDocs = ['aadhaar', 'pan'];
      const allRequiredVerified = requiredDocs.every(docType => {
        const doc = updatedEmployee.documents?.[docType as keyof typeof updatedEmployee.documents];
        return doc && doc.status === 'verified';
      });

      if (allRequiredVerified) {
        updatedEmployee.isVerified = true;
        updatedEmployee.verificationStatus = {
          documents: 'verified',
          profile: 'verified'
        };
      }

      storage.updateEmployee(updatedEmployee);
      loadEmployees();
      setShowDocumentModal(false);
      setSelectedDocument(null);
      setDocumentComment('');
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const documentTypes = [
    { key: 'aadhaar', label: 'Aadhaar Card', required: true },
    { key: 'pan', label: 'PAN Card', required: true },
    { key: 'passport', label: 'Passport', required: false },
    { key: 'drivingLicense', label: 'Driving License', required: false },
    { key: 'voterCard', label: 'Voter ID Card', required: false },
    { key: 'educationCertificate', label: 'Education Certificate', required: false },
    { key: 'experienceLetter', label: 'Experience Letter', required: false },
    { key: 'salarySlip', label: 'Previous Salary Slip', required: false }
  ];

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
              <p className="text-gray-600">Manage employee profiles and documents</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search employees..."
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map(employee => (
            <div key={employee.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-500">{employee.employeeId}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  employee.isVerified === true ? 'bg-green-100 text-green-800' :
                  employee.isVerified === false ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {employee.isVerified === true ? 'Verified' :
                   employee.isVerified === false ? 'Rejected' : 'Pending'}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.department && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{employee.department}</span>
                  </div>
                )}
                {employee.joiningDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(employee.joiningDate)}</span>
                  </div>
                )}
              </div>

              {/* Document Status */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Document Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {documentTypes.slice(0, 4).map(docType => {
                    const doc = employee.documents?.[docType.key as keyof typeof employee.documents];
                    return (
                      <div key={docType.key} className="flex items-center gap-1 text-xs">
                        {doc ? getDocumentStatusIcon(doc.status) : <XCircle className="w-4 h-4 text-gray-400" />}
                        <span className={doc ? getDocumentStatusColor(doc.status) : 'text-gray-400'}>
                          {docType.label.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setShowEmployeeModal(true);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No employees found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Employee Details</h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    <p className="text-gray-900">{selectedEmployee.employeeId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedEmployee.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-900">{selectedEmployee.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <p className="text-gray-900">{selectedEmployee.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <p className="text-gray-900">{selectedEmployee.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <p className="text-gray-900">{selectedEmployee.dateOfBirth ? formatDate(selectedEmployee.dateOfBirth) : 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <p className="text-gray-900 capitalize">{selectedEmployee.gender || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {selectedEmployee.address && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                      <p className="text-gray-900">{selectedEmployee.address.street}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <p className="text-gray-900">{selectedEmployee.address.city}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <p className="text-gray-900">{selectedEmployee.address.state}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <p className="text-gray-900">{selectedEmployee.address.pincode}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Employment Details */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                    <p className="text-gray-900">{selectedEmployee.joiningDate ? formatDate(selectedEmployee.joiningDate) : 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                    <p className="text-gray-900">{selectedEmployee.salary ? `₹${selectedEmployee.salary.toLocaleString()}` : 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {selectedEmployee.bankDetails && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <p className="text-gray-900">{selectedEmployee.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                      <p className="text-gray-900">{selectedEmployee.bankDetails.ifscCode}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <p className="text-gray-900">{selectedEmployee.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
                      <p className="text-gray-900">{selectedEmployee.bankDetails.accountHolderName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentTypes.map(docType => {
                    const doc = selectedEmployee.documents?.[docType.key as keyof typeof selectedEmployee.documents];
                    
                    return (
                      <div key={docType.key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">
                            {docType.label}
                            {docType.required && <span className="text-red-500 ml-1">*</span>}
                          </h5>
                          {doc && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDocumentStatusColor(doc.status)}`}>
                              {getDocumentStatusIcon(doc.status)}
                              <span className="capitalize">{doc.status}</span>
                            </div>
                          )}
                        </div>
                        
                        {doc ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">File: {doc.fileName}</p>
                            <p className="text-sm text-gray-600">Uploaded: {formatDate(doc.uploadDate)}</p>
                            {doc.documentNumber && (
                              <p className="text-sm text-gray-600">Number: {doc.documentNumber}</p>
                            )}
                            {doc.adminComment && (
                              <div className="bg-white rounded p-2">
                                <p className="text-xs font-medium text-gray-700">Admin Comment:</p>
                                <p className="text-xs text-gray-600">{doc.adminComment}</p>
                              </div>
                            )}
                            
                            {doc.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => {
                                    setSelectedDocument({ type: docType.key, doc });
                                    setDocumentAction('verify');
                                    setShowDocumentModal(true);
                                  }}
                                  className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700 transition-colors duration-200"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedDocument({ type: docType.key, doc });
                                    setDocumentAction('reject');
                                    setShowDocumentModal(true);
                                  }}
                                  className="flex-1 bg-red-600 text-white py-1 px-2 rounded text-xs hover:bg-red-700 transition-colors duration-200"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Not uploaded</p>
                            <label className="mt-2 inline-block">
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleDocumentUpload(selectedEmployee.id, docType.key, file);
                                  }
                                }}
                              />
                              <span className="bg-blue-600 text-white py-1 px-3 rounded text-xs hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                                Upload
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Review Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {documentAction === 'verify' ? 'Verify' : 'Reject'} Document
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Document: <span className="font-medium">{selectedDocument.doc.fileName}</span>
              </p>
              <p className="text-sm text-gray-600">
                Action: <span className={`font-medium ${documentAction === 'verify' ? 'text-green-600' : 'text-red-600'}`}>
                  {documentAction === 'verify' ? 'Verify' : 'Reject'}
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment {documentAction === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={documentComment}
                onChange={(e) => setDocumentComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder={`Add a comment for the ${documentAction}...`}
                required={documentAction === 'reject'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (documentAction === 'reject' && !documentComment.trim()) {
                    alert('Comment is required for rejection');
                    return;
                  }
                  handleDocumentReview(selectedEmployee!.id, selectedDocument.type, documentAction, documentComment);
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  documentAction === 'verify'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {documentAction === 'verify' ? 'Verify' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                  setDocumentComment('');
                }}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;