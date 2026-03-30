const { phone } = require("./request");

const UserSchema = {
  firstName: '',
  lastName: '',
  fatherName: '',
  dob: '', // Format: YYYY-MM-DD
  email: '',
  phone: '',
  countryCode: '', // e.g., '+91', '+1', '+65'
  city: '', // City of residence
  admin_number: '', // Admin contact number (unique)
  userId: '', // Custom generated ID (e.g., "johnd")
  role: 'employee', // 'admin' or 'employee'
  createdAt: new Date().toISOString(),
  approvedAt: null,
  isActive: true
};

module.exports = UserSchema;
