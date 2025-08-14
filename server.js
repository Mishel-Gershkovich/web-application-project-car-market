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
  const { username, password, phone } = req.body;

  try {
    if (!username || !password || !phone) {
      return res.status(400).json({ message: 'חסר שם משתמש/סיסמה/טלפון.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ message: 'שם המשתמש כבר קיים.' });
    }

    const newUser = new User({ username, password, phone });
    await newUser.save();
    res.json({ message: 'נרשמת בהצלחה!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאה בשרת' });
  }
});

app.post('/api/cars', async (req, res) => {
  const { manufacturer, model, year, description, username } = req.body;

  try {
    if (!username) {
      return res.status(401).json({ message: 'לא מזוהה משתמש מעלה.' });
    }

    const owner = await User.findOne({ username });
    if (!owner) {
      return res.status(404).json({ message: 'המשתמש המעלה לא נמצא.' });
    }

    const newCar = new Car({
      manufacturer,
      model,
      year,
      description,
      ownerUsername: owner.username,
      ownerName: owner.username, // אפשר להחליף לשם מלא אם יהיה שדה כזה
      ownerPhone: owner.phone
    });

    await newCar.save();
    res.json({ message: 'הרכב נוסף בהצלחה!', carId: newCar._id });
  } catch (error) {
    console.error(error);
    // בזמן פיתוח אפשר להחזיר את הודעת השגיאה האמיתית כדי להבין מה קורה:
    // return res.status(500).json({ message: error.message });
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

// עדכון רכב (בעלות בלבד)
app.put('/api/cars/:id', async (req, res) => {
  const { id } = req.params;
  const { manufacturer, model, year, description, username } = req.body;

  try {
    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: 'הרכב לא נמצא.' });

    if (!username || username !== car.ownerUsername) {
      return res.status(403).json({ message: 'אין הרשאה לערוך רכב זה.' });
    }

    car.manufacturer = manufacturer ?? car.manufacturer;
    car.model = model ?? car.model;
    car.year = year ?? car.year;
    car.description = description ?? car.description;

    await car.save();
    res.json({ message: 'הרכב עודכן בהצלחה.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאה בעדכון הרכב' });
  }
});

// מחיקת רכב (בעלות בלבד)
app.delete('/api/cars/:id', async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  try {
    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: 'הרכב לא נמצא.' });

    if (!username || username !== car.ownerUsername) {
      return res.status(403).json({ message: 'אין הרשאה למחוק רכב זה.' });
    }

    await car.deleteOne();
    res.json({ message: 'הרכב נמחק בהצלחה.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאה במחיקת הרכב' });
  }
});

// האזנה לשרת
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});