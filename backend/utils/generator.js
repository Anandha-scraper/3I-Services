const generateCredentials = (firstName, lastName, fatherName, dob) => {
  const fName = firstName ? firstName.toString().trim().toLowerCase() : '';
  const dadName = fatherName ? fatherName.toString() : '';

  // User ID: firstName (lowercase) + DDMM of dob
  const dobDate = dob ? dob.split('-') : [];
  const day = dobDate[2] || '';
  const month = dobDate[1] || '';
  const generatedUserId = `${fName}${day}${month}`;

  // Password: First 4 chars of fatherName + # + DOB day
  const generatedPassword = `${dadName.trim().substring(0, 4).toLowerCase()}#${day}`;

  return { generatedUserId, generatedPassword };
};

module.exports = { generateCredentials };
