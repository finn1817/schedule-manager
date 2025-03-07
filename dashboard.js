// Handle Excel file import
document.getElementById('import-excel').addEventListener('click', () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';
    
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // Assume the first sheet contains our data
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Store the data in Firebase
            storeDataInFirebase(jsonData);
        };
        reader.readAsArrayBuffer(file);
    });
    
    fileInput.click();
});

function storeDataInFirebase(data) {
    // Store the imported data
    db.collection('importedData').doc('latestImport').set({
        data: data,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Data imported successfully!');
    })
    .catch((error) => {
        alert('Error importing data: ' + error.message);
    });
}

// Navigation to other pages
document.getElementById('create-students').addEventListener('click', () => {
    window.location.href = "create-workers.html";
});

document.getElementById('modify-hours').addEventListener('click', () => {
    window.location.href = "modify-hours.html";
});

document.getElementById('create-schedule').addEventListener('click', () => {
    window.location.href = "create-schedule.html";
});

document.getElementById('view-workers').addEventListener('click', () => {
    window.location.href = "view-workers.html";
});

document.getElementById('logout').addEventListener('click', () => {
    window.location.href = "index.html";
});
