const express = require('express');
const router = express.Router();

// Public route example
router.get('/', (req, res) => {
  res.send('Welcome to the public endpoint!');
});

module.exports = router;
