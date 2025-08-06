const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// חיבור למסד
mongoose.connect('mongodb://localhost:27017/car-market', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// מודלים
const User = require('./model/User');
const Car = require('./model/Car');

// ראוטים
app.get('/api', (req, res) => {
  res.json({ message: 'ברוך הבא ל-Car Market API 🚗' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });

  if (user) {
    res.json({ message: 'התחברת בהצלחה!' });
  } else {
    res.json({ message: 'שם משתמש או סיסמה שגויים.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ message: 'שם המשתמש כבר קיים.' });
    }

    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ message: 'נרשמת בהצלחה!' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
});

app.post('/api/cars', async (req, res) => {
  const { manufacturer, model, year, description } = req.body;

  try {
    const newCar = new Car({ manufacturer, model, year, description });
    await newCar.save();
    res.json({ message: 'הרכב נוסף בהצלחה!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאה בשמירת הרכב' });
  }
});

app.get('/api/cars', async (req, res) => {
  try {
    const cars = await Car.find(); // מביא את כל הרכבים מהמסד
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בשליפת הרכבים' });
  }
});

// האזנה לשרת
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});