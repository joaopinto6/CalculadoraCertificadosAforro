require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const { google } = require('googleapis');
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const XLSX = require('xlsx');
const app = express();

app.use(express.json());
app.use(fileUpload());
app.use(express.static('public'));

// Google Sheets endpoint
app.post('/api/sheet-data', async (req, res) => {
  try {
    if (req.body.password !== process.env.ACCESS_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'A2:C',
    });

    const rows = response.data.values.map(row => ({
      type: row[0],
      date: row[1],
      units: parseFloat(row[2])
    }));

    res.json(await processSavings(rows));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update the Excel upload endpoint
app.post('/api/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.files.file.data, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: ['type', 'date', 'units'],
      range: 1,
      defval: null,
      raw: false, // Get formatted values instead of raw numbers
      dateNF: 'dd/mm/yyyy' // Specify date format
    });

    // Convert Excel dates and format properly
    const validRows = rows.filter(row => row.type && row.date && !isNaN(row.units))
      .map(row => {
        // Convert Excel serial date to JS Date
        let dateStr = row.date;
        if (typeof row.date === 'number') {
          const date = XLSX.SSF.parse_date_code(row.date);
          dateStr = `${String(date.d).padStart(2, '0')}/${
                     String(date.m).padStart(2, '0')}/${
                     date.y}`;
        }
        
        // Ensure date format is DD/MM/YYYY
        const [d, m, y] = dateStr.split(/[/-]/);
        const formattedDate = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;

        return {
          type: String(row.type).trim().toUpperCase(),
          date: formattedDate,
          units: parseFloat(row.units)
        };
      });

    res.json(await processSavings(validRows));
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
});

async function processSavings(rows) {
  // Add this date formatting utility function
  function toFirstDayOfMonth(dateString) {
    const [day, month, year] = dateString.split('/');
    return `01/${month}/${year}`;
  }

  // In your processSavings function, modify the params creation:
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYear = currentDate.getFullYear();

  const results = await Promise.all(rows.map(async (row) => {
    try {
      const params = new URLSearchParams({
        field_serie: row.type.toUpperCase(),
        field_field_date: `01/${currentMonth}/${currentYear}`,
        field_field_acquisition_date: toFirstDayOfMonth(row.date),
        quantity: row.units
      });

      const response = await fetch(`https://www.igcp.pt/pt/api/simulator-value/query?${params}`);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Add validation for API response structure
      if (!Array.isArray(data) || !data[0]?.field_value) {
        console.error('Invalid API response:', data);
        return {
          ...row,
          value: 0,
          error: 'Invalid API response'
        };
      }

      return {
        ...row,
        value: data[0].field_value
      };
    } catch (error) {
      console.error('Error processing row:', row, error);
      return {
        ...row,
        value: 0,
        error: error.message
      };
    }
  }));

  const total = results.reduce((sum, item) => sum + (item.value || 0), 0);
  return { results, total };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));