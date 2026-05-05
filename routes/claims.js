const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const Item = require('../models/Item');
const { requireLogin } = require('../middleware/auth');

// POST /claims — submit a claim
router.post('/', requireLogin, async (req, res) => {
  const { itemId, message } = req.body;
  const item = await Item.findById(itemId).populate('reportedBy', 'username email');
  if (!item) return res.redirect('/');

  // Prevent claiming your own item
  if (item.reportedBy._id.toString() === req.session.user.id)
    return res.redirect(`/items/${itemId}`);

  // Prevent duplicate claim
  const existing = await Claim.findOne({ item: itemId, claimedBy: req.session.user.id });
  if (existing) return res.redirect(`/items/${itemId}`);

  await Claim.create({ item: itemId, claimedBy: req.session.user.id, message });
  res.redirect(`/items/${itemId}?claimed=1`);
});

module.exports = router;
