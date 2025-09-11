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
const Message = require('./model/Message');

// אדמין
async function ensureAdmin() {
  try {
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      await User.create({
        username: 'admin',
        password: '*********',
        phone: '0509854267',
        role: 'admin'
      });
      console.log('👑 Seeded admin user: admin');
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

    const strongPass = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strongPass.test(password)) {
      return res.status(400).json({
        message: 'הסיסמה חייבת להיות לפחות 8 תווים, לכלול אות גדולה אחת, מספר אחד וסימן אחד.'
      });
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

// שליחת הודעה
app.post('/api/messages', async (req, res) => {
  try {
    const { fromUsername, toUsername, text, carId } = req.body || {};
    if (!fromUsername || !toUsername || !text || !text.trim()) {
      return res.status(400).json({ message: 'חסרים נתונים לשליחת הודעה.' });
    }
    if (fromUsername === toUsername) {
      return res.status(400).json({ message: 'אי אפשר לשלוח הודעה לעצמך.' });
    }

    const from = await User.findOne({ username: fromUsername });
    const to   = await User.findOne({ username: toUsername });
    if (!from || !to) return res.status(404).json({ message: 'משתמש לא נמצא.' });

    let car = null;
    if (carId) {
      try { car = await Car.findById(carId); } catch(_) {}
    }

    const msg = await Message.create({
      fromUsername, toUsername, text: text.trim(), car: car ? car._id : undefined
    });

    res.json({ message: 'הודעה נשלחה.', msg });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'שגיאה בשליחת הודעה.' });
  }
});

// קבלת תיבת ההודעות של משתמש (הודעות שנשלחו אליו)
app.get('/api/messages', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'חסר פרמטר username.' });

    const list = await Message.find({ toUsername: username }).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'שגיאה בשליפת הודעות.' });
  }
});

// מחיקת הודעה (הנמען או אדמין)
app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body || {};
    if (!username) return res.status(400).json({ message: 'חסר username.' });

    const actingUser = await User.findOne({ username });
    if (!actingUser) return res.status(403).json({ message: 'משתמש לא מוכר.' });

    const msg = await Message.findById(id);
    if (!msg) return res.status(404).json({ message: 'הודעה לא נמצאה.' });

    const isAdmin = actingUser.role === 'admin';
    if (!isAdmin && msg.toUsername !== username) {
      return res.status(403).json({ message: 'אין הרשאה למחוק הודעה זו.' });
    }

    await Message.deleteOne({ _id: id });
    res.json({ message: 'ההודעה נמחקה.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'שגיאה במחיקת הודעה.' });
  }
});


app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'סוג קובץ לא נתמך') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// ===== Admin: Users Management =====
app.get('/api/admin/users', async (req, res) => {
  try {
    const { username } = req.query;
    const actingUser = await User.findOne({ username });
    if (!actingUser || actingUser.role !== 'admin') {
      return res.status(403).json({ message: 'אין הרשאה.' });
    }

    const users = await User.find({}, 'username phone role'); // בלי סיסמאות
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'שגיאה בשליפת משתמשים.' });
  }
});

// מחיקת משתמש (אדמין בלבד) + מחיקה קשורה
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body || {};

    const actingUser = await User.findOne({ username });
    if (!actingUser || actingUser.role !== 'admin') {
      return res.status(403).json({ message: 'אין הרשאה.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'המשתמש לא נמצא.' });

    // הגנות בסיסיות
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'לא ניתן למחוק משתמש בעל תפקיד אדמין.' });
    }

    // מחיקת תוכן קשור
    const usernameToRemove = user.username;

    // 1) מחיקת רכבים שבבעלותו
    const carsResult = await Car.deleteMany({ ownerUsername: usernameToRemove });

    // 2) ניקוי תגובות של המשתמש מכל הרכבים
    const commentsResult = await Car.updateMany(
      {},
      { $pull: { comments: { $or: [{ userId: user._id }, { username: usernameToRemove }] } } }
    );

    // 3) מחיקת הודעות שנשלחו או התקבלו ע"י המשתמש
    const msgsResult = await Message.deleteMany({
      $or: [{ fromUsername: usernameToRemove }, { toUsername: usernameToRemove }]
    });

    // 4) מחיקת המשתמש עצמו
    await user.deleteOne();

    res.json({
      message: 'המשתמש נמחק בהצלחה.',
      stats: {
        carsDeleted: carsResult.deletedCount || 0,
        messagesDeleted: msgsResult.deletedCount || 0,
        commentsUpdatedDocs: commentsResult.modifiedCount || 0
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'שגיאה במחיקת משתמש.' });
  }
});

// האזנה לשרת
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});