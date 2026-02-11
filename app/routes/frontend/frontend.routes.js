const express = require('express');
const path = require('path');
const router = express.Router();

// Path to views from app/routes/frontend/ → ../../../views/
const viewsBase = path.join(__dirname, '../../../views');

// Home
router.get('/', (req, res) => {
  res.render(path.join(viewsBase, 'page/index.ejs'), {
    layout: path.join(viewsBase, 'layouts/main.layout.ejs'),
  });
});

// Mount frontend sub-routes here, e.g.:
// router.use('/about', require('./about/about.routes'));
// router.use('/auth', require('./auth/auth.routes'));
// router.use('/contact', require('./contact/contact.routes'));

module.exports = router;
