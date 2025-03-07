document.addEventListener('DOMContentLoaded', async () => {
    // Handle location change to load appropriate hours
    document.getElementById('location').addEventListener('change', loadHours);
    
    // Initial load of hours for the default location
    await loadHours();
    
    // Add event listeners to closed checkboxes to disable time inputs
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    days.forEach(day => {
        const checkbox = document.getElementById(`${day}-closed`);
        checkbox.addEventListener('change', () => {
            document.getElementById(`${day}-open`).disabled = checkbox.checked;
            document.getElementById(`${day}-close`).disabled = checkbox.checked;
        });
    });
    
    // Save button event listener
    document.getElementById('save-hours').addEventListener('click', saveHours);
});

async function loadHours() {
    const location = document.getElementById('location').value;
    
    try {
        // Try to get existing hours for this location
        const hoursDoc = await db.collection('hours').doc(location).get();
        
        if (hoursDoc.exists) {
            const hours = hoursDoc.data();
            
            // Set the hours in the form
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            days.forEach(day => {
                if (hours[day]) {
                    document.getElementById(`${day}-open`).value = hours[day].open;
                    document.getElementById(`${day}-close`).value = hours[day].close;
                    document.getElementById(`${day}-closed`).checked = hours[day].closed;
                    
                    // Disable time inputs if closed
                    document.getElementById(`${day}-open`).disabled = hours[day].closed;
                    document.getElementById(`${day}-close`).disabled = hours[day].closed;
                }
            });
        }
    } catch (error) {
        alert(`Error loading hours: ${error.message}`);
    }
}

async function saveHours() {
    const location = document.getElementById('location').value;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    const hours = {};
    
    // Collect hours data from the form
    days.forEach(day => {
        hours[day] = {
            open: document.getElementById(`${day}-open`).value,
            close: document.getElementById(`${day}-close`).value,
            closed: document.getElementById(`${day}-closed`).checked
        };
    });
    
    try {
        // Save hours to Firestore
        await db.collection('hours').doc(location).set(hours);
        alert('Hours saved successfully!');
    } catch (error) {
        alert(`Error saving hours: ${error.message}`);
    }
}
