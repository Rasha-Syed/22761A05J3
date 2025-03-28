require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


const WINDOW_SIZE = parseInt(process.env.WINDOW_SIZE) || 10;
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS) || 2000; 
const API_BASE_URL = process.env.API_BASE_URL;
const API_ACCESS_CODE = process.env.API_ACCESS_CODE;

let numberWindow = [];

const apiEndpoints = {
  'p': 'primes',
  'f': 'fibo',
  'e': 'even',
  'r': 'rand'
};

const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
};

app.get('/numbers/:numberId', async (req, res) => {
  const { numberId } = req.params;
  
  if (!apiEndpoints[numberId]) {
    return res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r' });
  }

  const windowPrevState = [...numberWindow];
  const apiUrl = `${API_BASE_URL}/${apiEndpoints[numberId]}`;

  try {
    const response = await axios.get(apiUrl, {
      timeout: TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${API_ACCESS_CODE}`,
        'Content-Type': 'application/json'
      }
    });

    const newNumbers = Array.isArray(response.data.numbers) ? response.data.numbers : [];

    // Process numbers (allow duplicates if needed)
    newNumbers.forEach(num => {
      if (numberWindow.length >= WINDOW_SIZE) {
        numberWindow.shift();
      }
      numberWindow.push(num);
    });

    res.json({
      windowPrevState,
      windowCurrState: [...numberWindow],
      numbers: newNumbers,
      avg: calculateAverage(numberWindow)
    });

  } catch (error) {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      config: error.config // Shows request details
    });

    res.status(500).json({
      windowPrevState,
      windowCurrState: [...numberWindow],
      numbers: [],
      avg: calculateAverage(numberWindow),
      error: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 9876;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});