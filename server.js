// server.js
import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const upload = multer();
const port = process.env.PORT || 3000;

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

app.use(express.static('public'));
app.use(express.json());

// Function to fetch and parse savings data
async function fetchSavings(type, date, units) {
  try {
    const url = `https://www.igcp.pt/pt/aforro/simulacao.php?serie=${type}&data=${date}&uni=${units}`;
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const value = $('tr:first-child td:last-child').text().trim();
    return parseFloat(value.split(' ')[0].replace(',', '.')) || 0; // Convert to number, default to 0 if invalid
  } catch (error) {
    console.error('Error fetching savings:', error);
    return 0;
  }
}

// Function to process file content
function processFileContent(buffer, mimetype) {
  try {
    if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const workbook = XLSX.read(buffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } else {
      const content = buffer.toString().trim();
      return content.split('\n')
        .map(row => row.trim())
        .filter(row => row)
        .map(row => row.split(',').map(cell => cell.trim()));
    }
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error('Failed to process file');
  }
}

// Function to validate and clean data row
function validateRow([type, date, units]) {
  if (!type || !date || !units) return null;
  return {
    type, date, units
  };
}

// Personal savings endpoint (protected)
app.post('/api/personal-savings', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (password !== process.env.ACCESS_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'A2:C',
    });

    const rows = response.data.values || [];
    const savings = await Promise.all(
      rows.map(async ([type, date, units]) => {
        const value = await fetchSavings(type, date, parseInt(units, 10));
        return { type, date, units, value };
      })
    );

    const total = savings.reduce((sum, item) => sum + item.value, 0);

    res.json({
      total: total.toFixed(2),
      savings
    });
  } catch (error) {
    console.error('Personal savings error:', error);
    res.status(500).json({ error: 'Failed to fetch personal savings' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    let rows = processFileContent(req.file.buffer, req.file.mimetype);
    
    // Check for headers
    const hasHeaders = rows.length > 0 && rows[0].some(cell => 
      typeof cell === 'string' && 
      cell.toLowerCase().match(/type|date|units/i)
    );

    // Remove headers if present
    if (hasHeaders) {
      rows = rows.slice(1);
    }

    // Process valid rows
    const validRows = rows
      .map(validateRow)
      .filter(row => row !== null);

    const savings = await Promise.all(
      validRows.map(async ({ type, date, units }) => {
        const value = await fetchSavings(type, date, units);
        return { type, date, units, value };
      })
    );

    const total = savings.reduce((sum, item) => sum + item.value, 0);

    res.json({
      total: total.toFixed(2),
      savings,
      fileInfo: {
        hadHeaders: hasHeaders,
        rowsProcessed: savings.length
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});