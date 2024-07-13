const express = require('express');
const scraper = require('./scraper');
const fs = require('fs');
const csvParse = require('csv-parse/lib/sync');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter missing.' });
    }

    try {
        await scraper(url);
        const emails = readEmailsFromCSV(); // Read emails from CSV after scraping
        res.json({ success: true, message: 'Emails extracted successfully.', emails });
    } catch (error) {
        console.error('Error scraping:', error);
        res.status(500).json({ error: 'Failed to scrape emails.' });
    }
});

function readEmailsFromCSV() {
    const csvFilePath = './emails.csv'; // Assuming 'emails.csv' is saved in the same directory
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const records = csvParse(csvData, { columns: true });
    return records.map(record => record.Email);
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
