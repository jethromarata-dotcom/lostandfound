const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const { requireLogin } = require('../middleware/auth');

const CATEGORIES = ['Electronics', 'Clothing', 'Bag / Backpack', 'ID / Card', 'Keys', 'Jewelry', 'Books / Notes', 'Sports Equipment', 'Other'];

// ─── Multer setup ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// ─── HOME ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { q, type, category, status } = req.query;
  let filter = {};
  if (q) filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { location: { $regex: q, $options: 'i' } }
  ];
  if (type && type !== 'all') filter.type = type;
  if (category && category !== 'All') filter.category = category;
  if (status && status !== 'All') filter.status = status;

  const items = await Item.find(filter).populate('reportedBy', 'username').sort({ createdAt: -1 });
  res.render('index', { items, CATEGORIES, q: q||'', selectedType: type||'all', selectedCategory: category||'All', selectedStatus: status||'All' });
});

// ─── REPORT ITEM FORM ─────────────────────────────────────────────────────────
router.get('/items/new', requireLogin, (req, res) => {
  res.render('items/new', { CATEGORIES, error: null });
});

router.post('/items', requireLogin, upload.single('image'), async (req, res) => {
  const { type, name, category, color, description, location, dateLostFound, contactEmail } = req.body;
  const item = new Item({
    type, name, category, color, description, location,
    dateLostFound: new Date(dateLostFound),
    contactEmail,
    image: req.file ? req.file.filename : null,
    reportedBy: req.session.user.id
  });
  await item.save();
  res.redirect(`/items/${item._id}`);
});

// ─── VIEW SINGLE ITEM + QR ────────────────────────────────────────────────────
router.get('/items/:id', async (req, res) => {
  const item = await Item.findById(req.params.id).populate('reportedBy', 'username email');
  if (!item) return res.redirect('/');
  const claims = await Claim.find({ item: item._id }).populate('claimedBy', 'username email');
  const os = require('os');
const nets = os.networkInterfaces();
let localIP = 'localhost';
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
  }
}
const itemUrl = `http://${localIP}:3000/items/${item._id}`;
  const qrCode = await QRCode.toDataURL(itemUrl, { width: 160, margin: 1 });

  // Check if current user already filed a claim
  let userClaim = null;
  if (req.session.user) {
    userClaim = await Claim.findOne({ item: item._id, claimedBy: req.session.user.id });
  }
  res.render('items/show', { item, claims, qrCode, itemUrl, userClaim, claimed: req.query.claimed || null });
});

// ─── EDIT FORM ────────────────────────────────────────────────────────────────
router.get('/items/:id/edit', requireLogin, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.redirect('/');
  // Only reporter or admin can edit
  if (item.reportedBy.toString() !== req.session.user.id && req.session.user.role !== 'admin')
    return res.redirect(`/items/${req.params.id}`);
  res.render('items/edit', { item, CATEGORIES, error: null });
});

router.post('/items/:id/update', requireLogin, upload.single('image'), async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.redirect('/');
  if (item.reportedBy.toString() !== req.session.user.id && req.session.user.role !== 'admin')
    return res.redirect(`/items/${req.params.id}`);

    const { type, name, category, color, description, location, dateLostFound, contactEmail, status } = req.body;
    if (type) item.type = type;
    item.name = name;
  item.name = name;
  item.category = category;
  item.color = color;
  item.description = description;
  item.location = location;
  item.dateLostFound = new Date(dateLostFound);
  item.contactEmail = contactEmail;
  if (status) item.status = status;
  if (req.file) item.image = req.file.filename;
  await item.save();
  res.redirect(`/items/${item._id}`);
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/items/:id', requireLogin, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.redirect('/');
  if (item.reportedBy.toString() !== req.session.user.id && req.session.user.role !== 'admin')
    return res.redirect(`/items/${req.params.id}`);
  await Claim.deleteMany({ item: item._id });
  await Item.findByIdAndDelete(req.params.id);
  res.redirect('/');
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  const totalLost    = await Item.countDocuments({ type: 'lost' });
  const totalFound   = await Item.countDocuments({ type: 'found' });
  const totalClaimed = await Item.countDocuments({ status: 'claimed' });
  const totalResolved= await Item.countDocuments({ status: 'resolved' });
  const byCategory   = await Item.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  const byStatus     = await Item.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const recent       = await Item.find().sort({ createdAt: -1 }).limit(6).populate('reportedBy','username');
  res.render('dashboard', { totalLost, totalFound, totalClaimed, totalResolved, byCategory, byStatus, recent });
});

// ─── BACKUP ───────────────────────────────────────────────────────────────────
router.get('/backup', requireLogin, async (req, res) => {
  const items = await Item.find({}).populate('reportedBy', 'username email');
  const claims = await Claim.find({}).populate('claimedBy', 'username email').populate('item', 'name type');
  res.setHeader('Content-Disposition', 'attachment; filename=lostandfound_backup.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ items, claims }, null, 2));
});

// ─── SEED ─────────────────────────────────────────────────────────────────────
router.get('/seed', async (req, res) => {
  const User = require('../models/User');
  await Item.deleteMany({});
  await Claim.deleteMany({});
  await User.deleteMany({});

  // Create admin
  const admin = new User({ username: 'admin', email: 'admin@university.edu', password: 'admin123', role: 'admin' });
  await admin.save();

  // Create a student
  const seedUser = new User({ username: 'student1', email: 'student1@university.edu', password: 'student123', role: 'student' });
  await seedUser.save();

  await Item.insertMany([
    { type: 'lost', name: 'Black Samsung Galaxy A54', category: 'Electronics', color: 'Black', description: 'Black Samsung phone with a cracked screen protector and a blue case. Has a sticker of a cat on the back.', location: 'Library, 2nd Floor', dateLostFound: new Date('2024-11-10'), contactEmail: 'student1@uni.edu', reportedBy: seedUser._id },
    { type: 'found', name: 'Blue Jansport Backpack', category: 'Bag / Backpack', color: 'Blue', description: 'Found a blue Jansport backpack near the canteen. Contains notebooks and a pencil case.', location: 'Main Canteen', dateLostFound: new Date('2024-11-12'), contactEmail: 'student2@uni.edu', reportedBy: seedUser._id },
    { type: 'lost', name: 'Student ID - Maria Santos', category: 'ID / Card', color: 'White', description: 'University ID belonging to Maria Santos, College of Engineering, 3rd year.', location: 'Science Building Hallway', dateLostFound: new Date('2024-11-13'), contactEmail: 'maria@uni.edu', reportedBy: seedUser._id },
    { type: 'found', name: 'Set of Keys (3 keys + lanyard)', category: 'Keys', color: 'Silver', description: 'Found a set of 3 keys on a red lanyard with a small rubber duck keychain near the gym entrance.', location: 'Gymnasium Entrance', dateLostFound: new Date('2024-11-14'), contactEmail: 'student3@uni.edu', reportedBy: seedUser._id },
    { type: 'lost', name: 'Wireless Earbuds (white)', category: 'Electronics', color: 'White', description: 'Lost white wireless earbuds, possibly JBL or similar brand. Last seen in the classroom.', location: 'Room 204, Engineering Building', dateLostFound: new Date('2024-11-15'), contactEmail: 'student4@uni.edu', reportedBy: seedUser._id },
    { type: 'found', name: 'Chemistry Notebook', category: 'Books / Notes', color: 'Yellow', description: 'Found a yellow spiral notebook with "CHEM 101" written on the cover. Has name "J. Reyes" inside.', location: 'Covered Walk near Admin Building', dateLostFound: new Date('2024-11-15'), contactEmail: 'student5@uni.edu', reportedBy: seedUser._id },
  ]);
  res.redirect('/');
});

module.exports = router;
