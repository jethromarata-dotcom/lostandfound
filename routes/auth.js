const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /auth/register
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/register', { error: null });
});

router.post('/register', async (req, res) => {
  const { username, email, password, confirm } = req.body;
  if (password !== confirm)
    return res.render('auth/register', { error: 'Passwords do not match.' });
  if (password.length < 6)
    return res.render('auth/register', { error: 'Password must be at least 6 characters.' });
  const exists = await User.findOne({ $or: [{ username }, { email }] });
  if (exists)
    return res.render('auth/register', { error: 'Username or email already in use.' });
  const user = new User({ username, email, password, role: 'student' });
  await user.save();
  req.session.user = { id: user._id, username: user.username, email: user.email, role: user.role };
  res.redirect('/');
});

// GET /auth/login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.comparePassword(password)))
    return res.render('auth/login', { error: 'Invalid username or password.' });
  req.session.user = { id: user._id, username: user.username, email: user.email, role: user.role };
  res.redirect('/');
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
