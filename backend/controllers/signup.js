const { auth } = require('../config/firebase');
const { sendEmailToAdmin, sendCredentialsEmail } = require('../utils/mailer');
const { generateCredentials } = require('../utils/generator');
const registrationService = require('../services/registration');
const userService = require('../services/user');

// Submit registration request
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, fatherName, dob, email, phone, city } = req.body;

    if (!firstName || !lastName || !email || !dob || !fatherName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for existing phone number
    if (phone) {
      const existingPhoneRequest = await registrationService.findByPhone(phone);
      if (existingPhoneRequest.length > 0) {
        return res.status(409).json({ status: 'phone_in_use', message: 'Phone number already in a pending request' });
      }
      const existingPhoneUser = await userService.findByPhone(phone);
      if (existingPhoneUser) {
        return res.status(409).json({ status: 'phone_in_use', message: 'Phone number already linked to an account' });
      }
    }

    // Check existing pending request
    const pendingRequest = await registrationService.findByEmailAndStatus(email, 'pending');
    if (pendingRequest.length > 0) {
      return res.status(409).json({ status: 'already_requested', message: 'Registration already pending' });
    }

    // Check existing user
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ status: 'already_exists', message: 'Account already exists', userId: existingUser.userId });
    }

    // Check Firebase Auth
    try {
      await auth.getUserByEmail(email);
      return res.status(409).json({ status: 'already_exists', message: 'Account already exists' });
    } catch (e) { /* Expected for new users */ }

    // Check rejected requests
    const anyRequest = await registrationService.findByEmail(email);
    if (anyRequest.length > 0 && anyRequest[0].status === 'rejected') {
      return res.status(409).json({ status: 'rejected', message: 'Previous request was rejected' });
    }

    // Create request
    const newRequest = await registrationService.createRequest({ firstName, lastName, fatherName, dob, email, phone: phone || '', city: city || '' });

    // Notify admin
    sendEmailToAdmin({ requestId: newRequest.id, firstName, lastName, email }).catch(() => {});

    res.status(201).json({ message: 'Registration submitted', requestId: newRequest.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending requests (admin)
exports.getPending = async (req, res) => {
  try {
    const requests = await registrationService.getPendingRequests();
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all requests (admin)
exports.getAll = async (req, res) => {
  try {
    const requests = await registrationService.getAllRequests();
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve request (admin)
exports.approve = async (req, res) => {
  try {
    const requestId = req.params.id;
    if (!requestId) return res.status(400).json({ message: 'Request ID required' });

    const request = await registrationService.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: `Already ${request.status}` });

    const existingUser = await userService.findByEmail(request.email);
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    const { generatedUserId, generatedPassword } = generateCredentials(request.firstName, request.lastName, request.fatherName, request.dob);

    // Create Firebase Auth user
    await auth.createUser({ email: request.email, password: generatedPassword });

    // Create user in Firestore
    await userService.createUser({
      firstName: request.firstName,
      lastName: request.lastName,
      fatherName: request.fatherName,
      dob: request.dob,
      email: request.email,
      phone: request.phone || '',
      city: request.city || '',
      userId: generatedUserId,
      role: 'employee'
    });

    await registrationService.deleteRequest(requestId);

    // Send credentials email
    sendCredentialsEmail({ email: request.email, firstName: request.firstName, userId: generatedUserId, password: generatedPassword }).catch(() => {});

    res.status(200).json({ message: 'User approved', userId: generatedUserId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject request (admin)
exports.reject = async (req, res) => {
  try {
    const requestId = req.params.id;
    if (!requestId) return res.status(400).json({ message: 'Request ID required' });

    const request = await registrationService.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ message: `Already ${request.status}` });

    await registrationService.updateStatus(requestId, 'rejected');
    res.status(200).json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
