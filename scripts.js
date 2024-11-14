document.addEventListener('DOMContentLoaded', function() {
  // Load records from localStorage and populate table on page load
  loadRecordsFromLocalStorage();

  // Display current date in the form header
  const currentDate = new Date().toLocaleDateString();
  document.getElementById('currentDate').textContent = `Date: ${currentDate}`;

  const employeeIdSelect = document.getElementById('employeeId');
  const employeeNameSelect = document.getElementById('employeeName');
  const statusSelect = document.getElementById('status');
  const addTimeEntryButton = document.getElementById('addTimeEntry');
  const timeEntriesDiv = document.getElementById('timeEntries');

  // Disable Add Another Time Entry button initially
  addTimeEntryButton.disabled = true;

  // Synchronize Employee ID, Name, Designation, and Date of Joining selections
  employeeIdSelect.addEventListener('change', syncEmployeeData);
  employeeNameSelect.addEventListener('change', syncEmployeeData);

  // Enable or disable Add Another Time Entry button based on status selection
  statusSelect.addEventListener('change', function() {
    const status = this.value;
    if (status === "Absent") {
      // Disable the time entries and "Add Another Time Entry" button when status is "Absent"
      disableTimeEntries();
      addTimeEntryButton.disabled = true; // Disable Add Time Entry button
    } else {
      // Enable the time entries and "Add Another Time Entry" button when status is anything but "Absent"
      enableTimeEntries();
      addTimeEntryButton.disabled = false; // Enable Add Time Entry button
    }
  });

  // Function to synchronize employee data
  function syncEmployeeData() {
    const selectedId = employeeIdSelect.value;
    const nameOption = Array.from(employeeNameSelect.options).find(option => option.dataset.id === selectedId);
    if (nameOption) {
      employeeNameSelect.value = nameOption.value;
      document.getElementById('designation').value = nameOption.dataset.designation;
      document.getElementById('dateOfJoining').value = nameOption.dataset.doj;
    }
  }

  // Add another time entry
  addTimeEntryButton.addEventListener('click', function() {
    const uniqueId = Date.now(); // Unique ID for each time entry
    const newEntry = document.createElement('div');
    newEntry.classList.add('time-entry');
    newEntry.innerHTML = `
      <label for="inTime${uniqueId}">In Time:</label>
      <input type="time" id="inTime${uniqueId}" class="inTime" required>
      <label for="outTime${uniqueId}">Out Time:</label>
      <input type="time" id="outTime${uniqueId}" class="outTime">
      <button type="button" class="removeTimeEntry">Remove</button>
    `;
    timeEntriesDiv.appendChild(newEntry);

    // Add event listener for the remove button
    newEntry.querySelector('.removeTimeEntry').addEventListener('click', function() {
      timeEntriesDiv.removeChild(newEntry);
    });
  });

  // Handle form submission
  document.getElementById('attendanceForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const employeeId = document.getElementById('employeeId').value;
    const employeeName = document.getElementById('employeeName').value;
    const designation = document.getElementById('designation').value;
    const dateOfJoining = document.getElementById('dateOfJoining').value;
    const status = document.getElementById('status').value;
    const date = new Date().toLocaleDateString();

    const inTimes = Array.from(document.querySelectorAll('.inTime')).map(input => input.value);
    const outTimes = Array.from(document.querySelectorAll('.outTime')).map(input => input.value);

    const record = {
      employeeId,
      employeeName,
      designation,
      dateOfJoining,
      status,
      inTimes,
      outTimes,
      date
    };

    addRecordToTable(record);
    saveRecordToLocalStorage(record);
    this.reset();
    addTimeEntryButton.disabled = true; // Disable button after submission
  });

  // Reset all records
  document.getElementById('resetData').addEventListener('click', function() {
    localStorage.removeItem('attendanceRecords');
    loadRecordsFromLocalStorage();
  });

  // Generate PDF
  document.getElementById('generatePdf').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text('Employee Attendance Records', 20, 10);
    doc.autoTable({ html: '#attendanceTable' });
    doc.save('attendance_records.pdf');
  });

  // Generate Excel
  document.getElementById('generateExcel').addEventListener('click', function() {
    const table = document.getElementById('attendanceTable');
    const workbook = XLSX.utils.table_to_book(table);
    XLSX.writeFile(workbook, 'attendance_records.xlsx');
  });
});

// Function to load records from localStorage and populate the table
function loadRecordsFromLocalStorage() {
  const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
  const tableBody = document.getElementById('attendanceTable').getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  records.forEach(record => {
    addRecordToTable(record);
  });
}

// Function to add record to the table
function addRecordToTable(record) {
  const table = document.getElementById('attendanceTable').getElementsByTagName('tbody')[0];
  const newRow = table.insertRow();

  const idCell = newRow.insertCell(0);
  const nameCell = newRow.insertCell(1);
  const designationCell = newRow.insertCell(2);
  const dojCell = newRow.insertCell(3);
  const statusCell = newRow.insertCell(4);
  const inTimeCell = newRow.insertCell(5);
  const outTimeCell = newRow.insertCell(6);
  const dateCell = newRow.insertCell(7);
  const removeCell = newRow.insertCell(8); // New cell for remove button

  idCell.textContent = record.employeeId;
  nameCell.textContent = record.employeeName;
  designationCell.textContent = record.designation;
  dojCell.textContent = record.dateOfJoining;
  statusCell.textContent = record.status;
  inTimeCell.textContent = record.inTimes.join(', ');
  outTimeCell.textContent = record.outTimes.join(', ');
  dateCell.textContent = record.date;

  // Create remove button
  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remove';
  removeButton.classList.add('removeRecordButton');
  removeButton.style.marginLeft = '10px';

  // Append the button to the remove cell
  removeCell.appendChild(removeButton);

  // Add event listener for the remove button
  removeButton.addEventListener('click', function() {
    // Remove the row from the table
    table.deleteRow(newRow.rowIndex - 1); // Adjust for header

    // Remove the record from localStorage
    removeRecordFromLocalStorage(record);
  });
}

// Function to save record to localStorage
function saveRecordToLocalStorage(record) {
  const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
  records.push(record);
  localStorage.setItem('attendanceRecords', JSON.stringify(records));
}

// Function to remove the record from localStorage
function removeRecordFromLocalStorage(recordToRemove) {
  let records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
  records = records.filter(record => 
    record.employeeId !== recordToRemove.employeeId || record.date !== recordToRemove.date
  );
  localStorage.setItem('attendanceRecords', JSON.stringify(records));
}

// Function to disable the time entries
function disableTimeEntries() {
  document.querySelectorAll('.inTime').forEach(input => {
    input.disabled = true;
    input.required = false; // Remove required attribute
  });
  document.querySelectorAll('.outTime').forEach(input => {
    input.disabled = true;
  });
}

// Function to enable the time entries
function enableTimeEntries() {
  document.querySelectorAll('.inTime').forEach(input => {
    input.disabled = false;
    input.required = true; // Restore required attribute
  });
  document.querySelectorAll('.outTime').forEach(input => {
    input.disabled = false;
  });
}




