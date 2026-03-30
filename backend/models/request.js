const RequestSchema = {
  firstName: '',
  lastName: '',
  fatherName: '',
  dob: '', // Format: YYYY-MM-DD
  email: '',
  phone: '',
  status: 'pending', // 'pending', 'approved', 'rejected'
  createdAt: new Date().toISOString(),
  processedAt: null,
  processedBy: null, // Admin UID who processed
  rejectionReason: null
};

module.exports = RequestSchema;
