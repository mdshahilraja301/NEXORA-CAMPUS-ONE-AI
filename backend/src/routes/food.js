const express = require('express');
const FoodSuggestion = require('../models/FoodSuggestion');
const { requireAuth, allowRoles } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

router.get('/menu', (req, res) => res.json({ menu: [
  { day: 'Monday', breakfast: 'Poha and tea', lunch: 'Dal, rice, paneer and roti', dinner: 'Seasonal vegetables and roti' },
  { day: 'Tuesday', breakfast: 'Idli and sambar', lunch: 'Rajma, rice and salad', dinner: 'Aloo gobhi and roti' },
  { day: 'Wednesday', breakfast: 'Upma and fruit', lunch: 'Chole, rice and roti', dinner: 'Khichdi and curd' },
  { day: 'Thursday', breakfast: 'Paratha and curd', lunch: 'Dal, rice and seasonal sabzi', dinner: 'Paneer and roti' },
  { day: 'Friday', breakfast: 'Sandwich and milk', lunch: 'Kadhi, rice and roti', dinner: 'Veg pulao and raita' },
  { day: 'Saturday', breakfast: 'Dosa and chutney', lunch: 'Chole bhature', dinner: 'Mix veg and roti' },
  { day: 'Sunday', breakfast: 'Poori and sabzi', lunch: 'Veg biryani and raita', dinner: 'Dal and rice' }
] }));

router.post('/suggestions', async (req, res, next) => {
  try {
    const { dishName, preferredDay, notes } = req.body;
    if (!dishName?.trim()) return res.status(400).json({ message: 'Please enter a dish name.' });
    const suggestion = await FoodSuggestion.create({ user: req.user._id, dishName: dishName.trim(), preferredDay: preferredDay || 'Any day', notes: notes || '' });
    res.status(201).json({ suggestion });
  } catch (error) { next(error); }
});

router.get('/suggestions', async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' || req.user.role === 'faculty' ? {} : { user: req.user._id };
    const suggestions = await FoodSuggestion.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).limit(200);
    res.json({ suggestions });
  } catch (error) { next(error); }
});

router.patch('/suggestions/:id', allowRoles('admin', 'faculty'), async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!['Pending', 'Reviewed', 'Accepted', 'Declined'].includes(status)) return res.status(400).json({ message: 'Invalid suggestion status.' });
    const suggestion = await FoodSuggestion.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!suggestion) return res.status(404).json({ message: 'Suggestion not found.' });
    res.json({ suggestion });
  } catch (error) { next(error); }
});
module.exports = router;
