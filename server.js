const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const path = require('path');

const app = express();

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const MONGO_URI = 'mongodb://localhost:27017/lostandfound';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: 'lostandfound-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Make user available in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/', require('./routes/items'));
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/claims', require('./routes/claims'));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Lost & Found running at http://localhost:${PORT}`);
});
