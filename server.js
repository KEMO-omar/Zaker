import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Explicit routing for quotes file with UTF-8 support
const quotesPath = path.join(__dirname, 'تحفيز.json');
app.get(['/تحفيز.json', encodeURI('/تحفيز.json')], (req, res) => {
  res.sendFile(quotesPath);
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Single-page fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Zaker Shapap app listening on http://0.0.0.0:${PORT}`);
});
