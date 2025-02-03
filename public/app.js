async function fetchSheetData() {
    const password = document.getElementById('password').value;
    if (!password) return alert('Please enter password');

    showLoader();

    try {
        const response = await fetch('/api/sheet-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        alert(error.message);
    } finally {
        hideLoader();
    }
}

async function uploadFile() {
    const fileInput = document.getElementById('excelFile');
    if (!fileInput.files.length) return alert('Please select a file');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        showLoader();
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to process file');
        }

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        alert(error.message);
    } finally {
        hideLoader();
    }
}

function showLoader() {
    document.getElementById('results').innerHTML = '<div class="loader"></div>';
}

function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) loader.remove();
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Units</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                ${data.results.map(row => `
                    <tr>
                        <td>${row.type.toUpperCase()}</td>
                        <td>${row.date}</td>
                        <td>${row.units}</td>
                        <td>€${row.value.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align: right">Total:</td>
                    <td>€${data.total.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    `;
}