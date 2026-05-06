const express = require('express');
const router = express.Router();
router.post('/:gameId/roll', (req, res) => {
  res.json({ dice: [3, 5], position: 8 });
});
module.exports = router;