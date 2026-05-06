const express = require('express');
const router = express.Router();
router.post('/', (req, res) => {
  res.json({ roomId: 'room-123', name: '新房间' });
});
router.get('/', (req, res) => {
  res.json([{ id: 'room-123', name: '房间1' }]);
});
router.post('/:roomId/join', (req, res) => {
  res.json({ message: '已加入房间' });
});
module.exports = router;