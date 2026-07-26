const express = require('express');
const path = require('path');
const router = express.Router();

// Home
router.get('/', (req, res) => {
  res.render(path.join(__dirname, '../../../views/page/index.ejs'), {
    layout: path.join(__dirname, '../../../views/layouts/main.layout.ejs'),
  });
});

module.exports = router;
