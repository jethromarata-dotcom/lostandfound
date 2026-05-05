const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

// All admin routes require admin role
router.use(requireAdmin);

// GET /admin — admin dashboard overview
router.get('/', async (req, res) => {
  const pendingClaims = await Claim.find({ status: 'pending' })
    .populate('item')
    .populate('claimedBy', 'username email')
    .sort({ createdAt: -1 });
  const totalUsers = await User.countDocuments({ role: 'student' });
  const totalItems = await Item.countDocuments();
  const totalClaims = await Claim.countDocuments();
  res.render('admin/index', { pendingClaims, totalUsers, totalItems, totalClaims });
});

// GET /admin/claims — all claims
router.get('/claims', async (req, res) => {
  const claims = await Claim.find()
    .populate('item')
    .populate('claimedBy', 'username email')
    .sort({ createdAt: -1 });
  res.render('admin/claims', { claims });
});

// POST /admin/claims/:id/approve
router.post('/claims/:id/approve', async (req, res) => {
  const claim = await Claim.findById(req.params.id).populate('item').populate('claimedBy', 'username email');
  if (!claim) return res.redirect('/admin/claims');
  claim.status = 'approved';
  claim.adminNote = req.body.adminNote || '';
  await claim.save();
  // Mark item as claimed
  await Item.findByIdAndUpdate(claim.item._id, { status: 'claimed' });
  res.redirect('/admin/claims');
});

// POST /admin/claims/:id/reject
router.post('/claims/:id/reject', async (req, res) => {
  const claim = await Claim.findById(req.params.id);
  if (!claim) return res.redirect('/admin/claims');
  claim.status = 'rejected';
  claim.adminNote = req.body.adminNote || '';
  await claim.save();
  res.redirect('/admin/claims');
});

// GET /admin/items — manage all items
router.get('/items', async (req, res) => {
  const items = await Item.find().populate('reportedBy', 'username').sort({ createdAt: -1 });
  res.render('admin/items', { items });
});

// POST /admin/items/:id/resolve
router.post('/items/:id/resolve', async (req, res) => {
  await Item.findByIdAndUpdate(req.params.id, { status: 'resolved' });
  res.redirect('/admin/items');
});

// GET /admin/users
router.get('/users', async (req, res) => {
  const users = await User.find({ role: 'student' }).sort({ createdAt: -1 });
  res.render('admin/users', { users });
});

module.exports = router;
