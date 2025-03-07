document.addEventListener('DOMContentLoaded', () => {
    // Set default dates (current week)
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // Get Monday of current week
    
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4); // Friday is 4 days after Monday
    
    document.getElementById('start-date').valueAsDate = monday;
    document.getElementById('end-date').valueAsDate = friday;
});

document.getElementById('generate-schedule').addEventListener('click', async () => {
    const location = document.getElementById('location').value;
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    
    if (!startDate || !endDate) {
        alert('Please select start and end dates');
        return;
    }
    
    if (endDate < startDate) {
        alert('End date cannot be before start date');
        return;
    }
    
    // Get all workers and their availability from Firebase
    try {
        const workersSnapshot = await db.collection('workers').get();
        
        if (workersSnapshot.empty) {
            alert('No workers found. Please add workers first.');
            return;
        }
        
        // Process worker data
        const workers = [];
        workersSnapshot.forEach(doc => {
            workers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Generate the schedule
        const schedule = generateSchedule(location, startDate, endDate, workers);
        
        // Display the schedule
        displaySchedule(location, startDate, endDate, schedule);
        
    } catch (error) {
        alert('Error generating schedule: ' + error.message);
    }
});

function generateSchedule(location, startDate, endDate, workers) {
    // Map day numbers to day names
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Create a schedule object with days and time slots
    const schedule = {};
    
    // Iterate through each day in the date range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dayName = dayNames[dayOfWeek];
        const dateString = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        schedule[dateString] = {
            dayName: dayName,
            date: new Date(date),
            shifts: []
        };
        
        // Define shifts for this location (simplified example)
        let shifts;
        if (location === 'esports') {
            shifts = [
                { start: { hour: 10, minute: 0 }, end: { hour: 14, minute: 0 } },
                { start: { hour: 14, minute: 0 }, end: { hour: 18, minute: 0 } },
                { start: { hour: 18, minute: 0 }, end: { hour: 22, minute: 0 } }
            ];
        } else { // service center
            shifts = [
                { start: { hour: 8, minute: 0 }, end: { hour: 12, minute: 0 } },
                { start: { hour: 12, minute: 0 }, end: { hour: 16, minute: 0 } },
                { start: { hour: 16, minute: 0 }, end: { hour: 20, minute: 0 } }
            ];
        }
        
        // For each shift, find available workers
        shifts.forEach(shift => {
            const availableWorkers = findAvailableWorkers(workers, dayName, shift);
            
            // Pick a worker for this shift
            let assignedWorker = null;
            if (availableWorkers.length > 0) {
                // Simple assignment: pick the first available worker
                // In a real system, you'd have more complex logic like load balancing
                assignedWorker = availableWorkers[0];
            }
            
            schedule[dateString].shifts.push({
                startHour: shift.start.hour,
                startMinute: shift.start.minute,
                endHour: shift.end.hour,
                endMinute: shift.end.minute,
                startTime: formatTimeSlot(shift.start.hour, shift.start.minute),
                endTime: formatTimeSlot(shift.end.hour, shift.end.minute),
                worker: assignedWorker
            });
        });
    }
    
    return schedule;
}

function findAvailableWorkers(workers, dayName, shift) {
    return workers.filter(worker => {
        // Check if worker has availability for this day
        if (!worker.availability || !worker.availability[dayName]) {
            return false;
        }
        
        // Check each available time slot to see if it contains this shift
        return worker.availability[dayName].some(slot => {
            // Convert to minutes for easier comparison
            const slotStartMinutes = slot.startHour * 60 + slot.startMinute;
            const slotEndMinutes = slot.endHour * 60 + slot.endMinute;
            const shiftStartMinutes = shift.start.hour * 60 + shift.start.minute;
            const shiftEndMinutes = shift.end.hour * 60 + shift.end.minute;
            
            // The worker is available if their slot completely contains the shift
            return slotStartMinutes <= shiftStartMinutes && slotEndMinutes >= shiftEndMinutes;
        });
    });
}

function displaySchedule(location, startDate, endDate, schedule) {
    const outputContainer = document.getElementById('schedule-output');
    const scheduleContent = document.getElementById('schedule-content');
    const scheduleTitle = document.getElementById('schedule-title');
    
    // Set title based on location
    const locationName = location === 'esports' ? 'E-Sports Lounge' : 'ITS Service Center';
    scheduleTitle.textContent = `${locationName} Schedule (${formatDate(startDate)} - ${formatDate(endDate)})`;
    
    // Create table for the schedule
    let tableHtml = `
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Worker</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Sort dates in ascending order
    const sortedDates = Object.keys(schedule).sort();
    
    // Generate table rows
    sortedDates.forEach(dateString => {
        const day = schedule[dateString];
        const dayOfWeek = new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = formatDate(new Date(dateString));
        
        // Group by date
        let isFirstShiftOfDay = true;
        
        day.shifts.forEach(shift => {
            tableHtml += `
                <tr>
                    <td>${isFirstShiftOfDay ? formattedDate : ''}</td>
                    <td>${isFirstShiftOfDay ? dayOfWeek : ''}</td>
                    <td>${shift.startTime} - ${shift.endTime}</td>
                    <td>${shift.worker ? shift.worker.name : 'Unassigned'}</td>
                </tr>
            `;
            
            isFirstShiftOfDay = false;
        });
    });
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    // Set the HTML content
    scheduleContent.innerHTML = tableHtml;
    
    // Show the schedule output
    outputContainer.style.display = 'block';
}

// Format date to MM/DD/YYYY
function formatDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Format time slot (same as in create-workers.js)
function formatTimeSlot(hour, minute) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute === 0 ? '00' : minute} ${period}`;
}

// Print schedule functionality
document.getElementById('print-schedule').addEventListener('click', () => {
    const scheduleTitle = document.getElementById('schedule-title').textContent;
    const scheduleTable = document.querySelector('.schedule-table').outerHTML;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>${scheduleTitle}</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>${scheduleTitle}</h1>
            ${scheduleTable}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
});
