const express = require('express');
const Complaint = require('../models/Complaint');
const { requireAuth, allowRoles } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const { category, location, description, priority } = req.body;
    if (!category || !location?.trim() || !description?.trim()) return res.status(400).json({ message: 'Category, location and description are required.' });
    const complaint = await Complaint.create({ user: req.user._id, category, location: location.trim(), description: description.trim(), priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium' });
    res.status(201).json({ complaint });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const complaints = await Complaint.find(filter).populate('user', 'name email role').sort({ createdAt: -1 }).limit(200);
    res.json({ complaints });
  } catch (error) { next(error); }
});

router.patch('/:id/status', allowRoles('admin'), async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) return res.status(400).json({ message: 'Invalid complaint status.' });
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status, adminNote: String(adminNote || '').slice(0, 1000) }, { new: true, runValidators: true }).populate('user', 'name email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found.' });
    res.json({ complaint });
  } catch (error) { next(error); }
});

router.get('/summary', allowRoles('admin'), async (req, res, next) => {
  try {
    const [total, pending, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments(), Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }), Complaint.countDocuments({ status: 'Resolved' })
    ]);
    res.json({ total, pending, inProgress, resolved });
  } catch (error) { next(error); }
});
module.exports = router;
