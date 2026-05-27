const express = require('express');
const path = require('path');
const router = express.Router();

// Home
router.get('/', (req, res) => {
  res.render(path.join(__dirname, '../../../views/page/index.ejs'), {
    layout: path.join(__dirname, '../../../views/layouts/main.layout.ejs'),
  });
});

// Mount frontend sub-routes here, e.g.:
// router.use('/about', require('./about/about.routes'));
// router.use('/auth', require('./auth/auth.routes'));
// router.use('/contact', require('./contact/contact.routes'));

module.exports = router;
