const path = require('path');
const fs = require('fs');
const multer = require('multer');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const uploadDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname || ''));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('סוג קובץ לא נתמך'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // עד 5MB
});

// חיבור למסד
mongoose.connect('mongodb://localhost:27017/car-market', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('✅ Connected to MongoDB');
  await ensureAdmin(); // ← כאן
}).catch(err => console.error('❌ MongoDB connection error:', err));

// מודלים
const User = require('./model/User');
const Car = require('./model/Car');

// אדמין
async function ensureAdmin() {
  try {
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      await User.create({
        username: 'admin',
        password: 'admin123456',
        phone: '0509854267',
        role: 'admin'
      });
      console.log('👑 Seeded admin user: admin / admin123456');
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
      console.log('👑 Updated existing "admin" to role=admin');
    }
  } catch (e) {
    console.error('Failed to ensure admin:', e);
  }
}

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

app.post('/api/cars', upload.single('image'), async (req, res) => {
  const { manufacturer, model, year, description, username } = req.body;

  try {
    if (!username) {
      return res.status(401).json({ message: 'לא מזוהה משתמש מעלה.' });
    }

    const owner = await User.findOne({ username });
    if (!owner) {
      return res.status(404).json({ message: 'המשתמש המעלה לא נמצא.' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newCar = new Car({
      manufacturer,
      model,
      year: year ? Number(year) : undefined,
      description,
      ownerUsername: owner.username,
      ownerName: owner.username, // החלף לשם מלא אם יתווסף שדה כזה
      ownerPhone: owner.phone,
      imageUrl // ← כתובת התמונה המקומית (אם הועלתה)
    });

    await newCar.save();
    res.json({ message: 'הרכב נוסף בהצלחה!', carId: newCar._id, imageUrl });
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

// עדכון רכב (בעלות בלבד)
app.put('/api/cars/:id', async (req, res) => {
  const { id } = req.params;
  const { manufacturer, model, year, description, username } = req.body;

  try {
    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: 'הרכב לא נמצא.' });

    // 2) שליפת המשתמש הפועל ובדיקת אדמין
    const actingUser = await User.findOne({ username });
    const isAdmin = actingUser && actingUser.role === 'admin';

    // 3) הרשאה: אדמין או בעל הרכב
    if (!username || (!isAdmin && username !== car.ownerUsername)) {
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
    // 1) שליפת הרכב
    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: 'הרכב לא נמצא.' });

    // 2) שליפת המשתמש הפועל ובדיקת אדמין
    const actingUser = await User.findOne({ username });
    const isAdmin = actingUser && actingUser.role === 'admin';

    // 3) הרשאה: אדמין או בעל הרכב
    if (!username || (!isAdmin && username !== car.ownerUsername)) {
      return res.status(403).json({ message: 'אין הרשאה למחוק רכב זה.' });
    }

    await car.deleteOne();
    res.json({ message: 'הרכב נמחק בהצלחה.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאה במחיקת הרכב' });
  }
});

// הוספת תגובה לרכב
app.post('/api/cars/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { username, text } = req.body;

  if (!username || !text || !text.trim()) {
    return res.status(400).json({ message: 'חסר טקסט תגובה או משתמש.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(403).json({ message: 'משתמש לא מוכר.' });

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: 'הרכב לא נמצא.' });

    const comment = { username: user.username, userId: user._id, text: text.trim() };
    car.comments.push(comment);
    await car.save();

    const saved = car.comments[car.comments.length - 1]; // כולל _id שנוצר
    res.json({ message: 'התגובה נוספה.', comment: saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'שגיאה בהוספת תגובה.' });
  }
});

// מחיקת תגובה (בעל התגובה או אדמין)
app.delete('/api/cars/:id/comments/:commentId', async (req, res) => {
  const { id, commentId } = req.params;
  const { username } = req.body;

  try {
    const actingUser = await User.findOne({ username });
    if (!actingUser) return res.status(403).json({ message: 'משתמש לא מוכר.' });

    const isAdmin = actingUser.role === 'admin';
    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ message: 'הרכב לא נמצא.' });

    const comment = car.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'התגובה לא נמצאה.' });

    if (!isAdmin && comment.username !== username) {
      return res.status(403).json({ message: 'אין הרשאה למחוק תגובה זו.' });
    }

    // ⬅️ זה השינוי המרכזי: אין remove() במונגוס 7, משתמשים ב-deleteOne()
    comment.deleteOne();
    await car.save();

    res.json({ message: 'התגובה נמחקה.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'שגיאה במחיקת תגובה.' });
  }
});


app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'סוג קובץ לא נתמך') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// האזנה לשרת
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});