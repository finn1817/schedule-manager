// Generate time slots from 8:00 AM to 12:00 AM in 30-minute increments
function generateTimeSlots() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const startHour = 8; // 8:00 AM
    const endHour = 24;  // 12:00 AM (next day)
    
    days.forEach(day => {
        const container = document.getElementById(`${day}-slots`);
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = formatTimeSlot(hour, minute);
                const nextTimeString = formatTimeSlot(hour + (minute === 30 ? 1 : 0), minute === 30 ? 0 : 30);
                
                const slotLabel = `${timeString}-${nextTimeString}`;
                
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `${day}-${hour}-${minute}`;
                checkbox.dataset.day = day;
                checkbox.dataset.startHour = hour;
                checkbox.dataset.startMinute = minute;
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = slotLabel;
                
                slot.appendChild(checkbox);
                slot.appendChild(label);
                container.appendChild(slot);
            }
        }
    });
}

// Format time slots into readable strings
function formatTimeSlot(hour, minute) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute === 0 ? '00' : minute} ${period}`;
}

// Save worker data to Firebase
document.getElementById('save-worker').addEventListener('click', () => {
    const workerName = document.getElementById('worker-name').value.trim();
    
    if (!workerName) {
        alert('Please enter a worker name');
        return;
    }
    
    // Collect all checked time slots
    const availability = {};
    
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        availability[day] = [];
        
        const checkboxes = document.querySelectorAll(`input[type="checkbox"][data-day="${day}"]:checked`);
        checkboxes.forEach(checkbox => {
            const startHour = parseInt(checkbox.dataset.startHour);
            const startMinute = parseInt(checkbox.dataset.startMinute);
            
            // Calculate end time (30 minutes later)
            let endHour = startHour;
            let endMinute = startMinute + 30;
            
            if (endMinute >= 60) {
                endHour++;
                endMinute = 0;
            }
            
            availability[day].push({
                startHour,
                startMinute,
                endHour,
                endMinute,
                startTime: formatTimeSlot(startHour, startMinute),
                endTime: formatTimeSlot(endHour, endMinute)
            });
        });
    });
    
    // Save to Firestore
    db.collection('workers').add({
        name: workerName,
        availability: availability,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Worker added successfully!');
        document.getElementById('worker-name').value = '';
        // Uncheck all checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    })
    .catch(error => {
        alert('Error adding worker: ' + error.message);
    });
});

// Initialize time slots when page loads
document.addEventListener('DOMContentLoaded', generateTimeSlots);
