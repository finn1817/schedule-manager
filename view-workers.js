document.addEventListener('DOMContentLoaded', async () => {
    try {
        const workersSnapshot = await db.collection('workers').get();
        const workersList = document.getElementById('workers-list');
        
        // Clear loading message
        workersList.innerHTML = '';
        
        if (workersSnapshot.empty) {
            workersList.innerHTML = '<p>No workers found. Add some workers to get started.</p>';
            return;
        }
        
        // Display each worker
        workersSnapshot.forEach(doc => {
            const worker = {
                id: doc.id,
                ...doc.data()
            };
            
            const workerEl = createWorkerElement(worker);
            workersList.appendChild(workerEl);
        });
        
    } catch (error) {
        document.getElementById('workers-list').innerHTML = `<p>Error loading workers: ${error.message}</p>`;
    }
});

function createWorkerElement(worker) {
    const workerEl = document.createElement('div');
    workerEl.className = 'worker-item';
    workerEl.dataset.id = worker.id;
    
    // Worker name
    const nameEl = document.createElement('div');
    nameEl.className = 'worker-name';
    nameEl.textContent = worker.name;
    workerEl.appendChild(nameEl);
    
    // Worker availability
    if (worker.availability) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        
        days.forEach(day => {
            if (worker.availability[day] && worker.availability[day].length > 0) {
                const dayEl = document.createElement('div');
                dayEl.className = 'availability-day';
                
                const dayTitle = document.createElement('div');
                dayTitle.className = 'day-title';
                dayTitle.textContent = capitalizeFirstLetter(day);
                dayEl.appendChild(dayTitle);
                
                const timeSlots = document.createElement('div');
                timeSlots.className = 'time-slots';
                
                worker.availability[day].forEach(slot => {
                    const timeSlot = document.createElement('div');
                    timeSlot.className = 'time-slot';
                    timeSlot.textContent = `${slot.startTime} - ${slot.endTime}`;
                    timeSlots.appendChild(timeSlot);
                });
                
                dayEl.appendChild(timeSlots);
                workerEl.appendChild(dayEl);
            }
        });
    }
    
    // Control buttons
    const controlsEl = document.createElement('div');
    controlsEl.className = 'worker-controls';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
        // This would redirect to an edit page with the worker's ID
        alert('Edit functionality would be implemented here');
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete ${worker.name}?`)) {
            try {
                await db.collection('workers').doc(worker.id).delete();
                workerEl.remove();
                
                // Check if there are no more workers
                if (document.querySelectorAll('.worker-item').length === 0) {
                    document.getElementById('workers-list').innerHTML = 
                        '<p>No workers found. Add some workers to get started.</p>';
                }
            } catch (error) {
                alert(`Error deleting worker: ${error.message}`);
            }
        }
    });
    
    controlsEl.appendChild(editBtn);
    controlsEl.appendChild(deleteBtn);
    workerEl.appendChild(controlsEl);
    
    return workerEl;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
