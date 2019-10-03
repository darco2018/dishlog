const express = require('express');
const router = express.Router();
// authentication imports
const passport = require('passport');

const User = require('../models/user');

// show register form
// /auth/register
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// process register data
// /auth/register
router.post('/register', (req, res) => {
  const newUser = new User({
    username: req.body.username
  });
  // passportLocalMongoose method to hash pswd
  User.register(newUser, req.body.password, (err, user) => {
    console.log('-------- Registering user ' + newUser.username);

    if (err) {
      console.log(err);
      return res.render('auth/register');
    }

    passport.authenticate('local')(req, res, function() {
      console.log('------------Local-authenticating');
      res.redirect('/campgrounds');
    });
  });
});

// show login form
// /auth/login
router.get('/login', (req, res) => {
  res.render('auth/login' /*,  { message: req.flash('error')} */);
});

// process login data
// /auth/login
router.post(
  '/login',
  // middleware
  passport.authenticate('local', {
    successRedirect: '/campgrounds',
    failureRedirect: '/auth/login'
  }),
  function(req, res) {}
);

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'You have been logged out successfully');
  res.redirect('/campgrounds');
});

module.exports = router;
