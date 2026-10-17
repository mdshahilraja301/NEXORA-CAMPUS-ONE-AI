const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth);

// Replace these sample labels with verified campus buildings and coordinates before launch.
const locations = [
  { id: 'academic', name: 'Academic Block', category: 'Classrooms', description: 'Classrooms and faculty offices' },
  { id: 'library', name: 'Central Library', category: 'Library', description: 'Study spaces and book collection' },
  { id: 'mess', name: 'University Mess', category: 'Food', description: 'Dining and food services' },
  { id: 'hostel', name: 'Student Hostel', category: 'Hostel', description: 'Student accommodation' },
  { id: 'lab', name: 'Computer Lab', category: 'Lab', description: 'Computer and practical labs' },
  { id: 'admin', name: 'Administration Office', category: 'Others', description: 'Student and campus services' }
];
router.get('/locations', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const category = String(req.query.category || 'All');
  res.json({ locations: locations.filter(x => (!q || `${x.name} ${x.description}`.toLowerCase().includes(q)) && (category === 'All' || x.category === category)) });
});
module.exports = router;
