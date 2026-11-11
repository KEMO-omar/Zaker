import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const FIREBASE_RTDB_URL = 'https://shapap-13c58-default-rtdb.firebaseio.com/shapap';

async function pushToFirebase() {
  try {
    console.log('Pushing 82 lectures to Firebase RTDB...');
    const resLec = await fetch(`${FIREBASE_RTDB_URL}/lectures.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db.data.lectures)
    });
    console.log('Lectures status:', resLec.status);

    const resTasks = await fetch(`${FIREBASE_RTDB_URL}/weeklyTasks.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db.data.weeklyTasks)
    });
    console.log('WeeklyTasks status:', resTasks.status);

    console.log('Done syncing exact 82 lectures to Firebase RTDB!');
  } catch (err) {
    console.error('Firebase push error:', err);
  }
}

pushToFirebase();
