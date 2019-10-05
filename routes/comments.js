/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
const express = require('express');
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const comment = require('../models/comment');
const Comment = comment.commentModel;
const middleware = require('../middleware'); //index.js is imported by default from middleware folder

const router = express.Router({ mergeParams: true });

// NEW - show form to create new comment
// /campgrounds/:id/comments/new
router.get('/new', middleware.isLoggedIn, (req, res) => {
  // find campground and send it back
  Campground.findById(req.params.id, (err, found) => {
    console.log('id: ' + req.params.id);
    console.log('found: ' + found);

    if (err) {
      console.log(err);
      res.redirect('/campgrounds/' + found._id);
    }
    res.render('comment/new', { campground: found });
  });
});

// CREATE - add new comment
// /campgrounds/:id/comments
// /campgrounds/5d9372fa6c3da9223bcb1662/comments
router.post('/', middleware.isLoggedIn, (req, res) => {
  console.log('Receiving COMMENT form data by POST');

  // will execute only for logged users
  Campground.findById(req.params.id, (err, foundCampground) => {
    if (err) {
      console.log(err);
      res.redirect('/campgrounds/' + req.params.id);
    }

    Comment.create(req.body.comment, (err, savedComment) => {
      if (err) {
        console.log(err);
        req.flash('error', 'somethng went wrong...');
        req.redirect('back');
      }
      // add username & id to comment
      savedComment.author.id = req.user.id;
      savedComment.author.username = req.user.username;
      savedComment.save();
      foundCampground.comments.push(savedComment);
      foundCampground.save();
      console.log('Saved a new comment: ' + savedComment);
      req.flash('success', 'Successfully added comment...');
      res.redirect('/campgrounds/' + req.params.id);
    });
  });
});

// EDIT - show edit form
// campgrounds/:id/comments/:comment_id/edit
router.get(
  '/:comment_id/edit',
  middleware.checkCommentOwnership,
  (req, res) => {
    // prevent null campground
    Campground.findById(req.params.id, (err, foundCampground) => {
      if (err || !foundCampground) {
        // !null -> true
        console.log(
          `Error when retrieving campground ${foundCampground}; ${err}`
        );
        req.flash('error', 'Campground not found');
        return res.redirect('/campgrounds'); // breaks for 'back'
      } else {
        Comment.findById(req.params.comment_id, (err, foundComment) => {
          if (err) {
            console.log(err);
          }
          console.log('-------------foundComment id: ' + foundComment);

          res.render('comment/edit', {
            comment: foundComment,
            campgroundId: req.params.id
          });
        });
      }
    });
  }
);

// UPDATE
// campgrounds/:id/comments/:comment_id/update
// add ?_method=PUT in url  (method-override)
router.put(
  '/:comment_id/update',
  middleware.checkCommentOwnership,
  (req, res) => {
    const campgroundID = req.params.id;
    const commentID = req.params.comment_id;

    Comment.findByIdAndUpdate(
      commentID,
      req.body.comment, // thanks to campground[name]/[url]/[description] in view
      (err, updatedComment) => {
        if (err) {
          return console
            .log()
            .call(
              console,
              `Error when retrieving comment ${updatedComment}; ${err}`
            );
        }
        res.redirect(`/campgrounds/${campgroundID}`);
      }
    );
  }
);

// DESTROY - delete comment
// campgrounds/:id/comments/:comment_id/
// needs a FORM with post + method_override
router.delete('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
  console.log('--------deleting-------------');

  const campgroundID = req.params.id;
  const commentID = req.params.comment_id;

  Comment.findByIdAndDelete(commentID, err => {
    if (err) {
      console.log(err);
      res.redirect('back');
    }
    console.log('Deleted comment with id ' + commentID);
    req.flash('success', 'Comment deleted');
    res.redirect('/campgrounds/' + campgroundID);
  });
});

module.exports = router;