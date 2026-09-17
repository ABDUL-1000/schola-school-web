import * as XLSX from 'xlsx'

export interface ClassInfo {
  name: string
  level?: string | null
}

/**
 * Generates and downloads a structured Excel template for importing students.
 * Pre-populates sample data with real class names and provides a reference sheet.
 */
export function downloadStudentTemplate(
  availableClasses: Array<ClassInfo> = [],
  schoolName: string = 'Schola'
) {
  const wb = XLSX.utils.book_new()

  // Sample class names from actual school classes or fallbacks
  const firstClass = availableClasses[0]?.name || 'JSS 1A'
  const secondClass = availableClasses[1]?.name || 'SS 1 Science'

  // 1. Main Student Data Sheet
  const studentData = [
    {
      firstName: 'Chinedu',
      lastName: 'Okeke',
      middleName: 'Emeka',
      gender: 'Male',
      dateOfBirth: '2010-04-15',
      className: firstClass,
      guardianName: 'Dr. Arthur Okeke',
      guardianPhone: '08031234567',
      guardianEmail: 'arthur.okeke@example.com',
    },
    {
      firstName: 'Amina',
      lastName: 'Bello',
      middleName: 'Fatima',
      gender: 'Female',
      dateOfBirth: '2011-09-22',
      className: secondClass,
      guardianName: 'Hajiya Maryam Bello',
      guardianPhone: '08029876543',
      guardianEmail: 'maryam.bello@example.com',
    },
  ]

  const wsStudents = XLSX.utils.json_to_sheet(studentData, {
    header: [
      'firstName',
      'lastName',
      'middleName',
      'gender',
      'dateOfBirth',
      'className',
      'guardianName',
      'guardianPhone',
      'guardianEmail',
    ],
  })

  // Set column widths for readability
  wsStudents['!cols'] = [
    { wch: 16 }, // firstName
    { wch: 16 }, // lastName
    { wch: 16 }, // middleName
    { wch: 12 }, // gender
    { wch: 16 }, // dateOfBirth
    { wch: 20 }, // className
    { wch: 24 }, // guardianName
    { wch: 18 }, // guardianPhone
    { wch: 28 }, // guardianEmail
  ]

  XLSX.utils.book_append_sheet(wb, wsStudents, 'Students')

  // 2. Instructions & Valid Classes Reference Sheet
  const instructionsData: Array<Record<string, string>> = [
    {
      Field: 'firstName',
      Requirement: 'Required',
      Description: 'Student first name (e.g., John)',
    },
    {
      Field: 'lastName',
      Requirement: 'Required',
      Description: 'Student surname / family name (e.g., Doe)',
    },
    {
      Field: 'middleName',
      Requirement: 'Optional',
      Description: 'Student middle name or initial',
    },
    {
      Field: 'gender',
      Requirement: 'Required',
      Description: 'Accepted values: Male, Female, M, or F',
    },
    {
      Field: 'dateOfBirth',
      Requirement: 'Optional',
      Description: 'Format: YYYY-MM-DD (e.g., 2012-05-18)',
    },
    {
      Field: 'className',
      Requirement: 'Required',
      Description:
        'Must exactly match one of the active classes listed in the Valid Classes table below',
    },
    {
      Field: 'guardianName',
      Requirement: 'Optional',
      Description: 'Primary parent or guardian full name',
    },
    {
      Field: 'guardianPhone',
      Requirement: 'Optional',
      Description: 'Parent contact phone number',
    },
    {
      Field: 'guardianEmail',
      Requirement: 'Optional',
      Description: 'Parent email address for alerts and report cards',
    },
  ]

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData)
  wsInstructions['!cols'] = [
    { wch: 18 }, // Field
    { wch: 14 }, // Requirement
    { wch: 65 }, // Description
  ]

  // Add available classes in the instructions sheet
  if (availableClasses.length > 0) {
    const classRows = availableClasses.map((c, idx) => ({
      '#': idx + 1,
      'Valid Class Name': c.name,
      Level: c.level || 'General',
    }))
    const wsClasses = XLSX.utils.json_to_sheet(classRows)
    wsClasses['!cols'] = [{ wch: 6 }, { wch: 25 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsClasses, 'Valid Classes')
  }

  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions')

  const fileName = `${schoolName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_student_import_template.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * Generates and downloads a structured Excel template for importing staff.
 */
export function downloadStaffTemplate(schoolName: string = 'Schola') {
  const wb = XLSX.utils.book_new()

  // 1. Main Staff Data Sheet
  const staffData = [
    {
      firstName: 'Babatunde',
      lastName: 'Adeyemi',
      email: 'babatunde.adeyemi@example.com',
      phone: '08021112233',
      gender: 'Male',
      role: 'TEACHER',
      designation: 'Senior Mathematics Teacher',
    },
    {
      firstName: 'Grace',
      lastName: 'Okonkwo',
      email: 'grace.okonkwo@example.com',
      phone: '08034445566',
      gender: 'Female',
      role: 'ACCOUNTANT',
      designation: 'Bursar / Chief Accountant',
    },
    {
      firstName: 'Ibrahim',
      lastName: 'Musa',
      email: 'ibrahim.musa@example.com',
      phone: '08097778899',
      gender: 'Male',
      role: 'ADMIN',
      designation: 'Vice Principal (Administration)',
    },
  ]

  const wsStaff = XLSX.utils.json_to_sheet(staffData, {
    header: [
      'firstName',
      'lastName',
      'email',
      'phone',
      'gender',
      'role',
      'designation',
    ],
  })

  wsStaff['!cols'] = [
    { wch: 16 }, // firstName
    { wch: 16 }, // lastName
    { wch: 32 }, // email
    { wch: 18 }, // phone
    { wch: 12 }, // gender
    { wch: 16 }, // role
    { wch: 30 }, // designation
  ]

  XLSX.utils.book_append_sheet(wb, wsStaff, 'Staff')

  // 2. Instructions Sheet
  const instructionsData: Array<Record<string, string>> = [
    {
      Field: 'firstName',
      Requirement: 'Required',
      Description: 'Staff member first name',
    },
    {
      Field: 'lastName',
      Requirement: 'Required',
      Description: 'Staff member surname',
    },
    {
      Field: 'email',
      Requirement: 'Required, Unique',
      Description: 'Unique work or personal email used for login & invite',
    },
    {
      Field: 'phone',
      Requirement: 'Optional',
      Description: 'Primary phone number for SMS notifications and emergency contact',
    },
    {
      Field: 'gender',
      Requirement: 'Required',
      Description: 'Accepted values: Male, Female, M, F',
    },
    {
      Field: 'role',
      Requirement: 'Required',
      Description: 'Allowed roles: TEACHER, ACCOUNTANT, ADMIN',
    },
    {
      Field: 'designation',
      Requirement: 'Optional',
      Description: 'Job title / position (e.g. Physics Teacher, Head of Science)',
    },
  ]

  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData)
  wsInstructions['!cols'] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 65 },
  ]
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions & Roles')

  const fileName = `${schoolName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_staff_import_template.xlsx`
  XLSX.writeFile(wb, fileName)
}
