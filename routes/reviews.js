var express = require('express');
var router = express.Router({ mergeParams: true });
var Dish = require('../models/dish');
var Review = require('../models/review');
var middleware = require('../middleware');

const review = require('../controllers/review.controller');

// INDEX - all reviews for a given DISH
// /dishes/:id/reviews/
router.get('/', async function(req, res) {
  /* 
  try {
    console.log(">>>>>>>>>>>>> See all reviews");
    
    const dish = await Dish.findById(req.params.id)
      .populate({
        path: 'reviews',
        options: { sort: { createdAt: -1 } } // sorting the populated reviews array to show the latest first. Limit reviews to 1
      })
      .exec();

    res.render('review/index', { dish: dish });
  } catch (err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
 */
  Dish.findById(req.params.id)
    .populate({
      path: 'reviews',
      options: { sort: { createdAt: -1 } } // sorting the populated reviews array to show the latest first. Limit reviews to 1
    })
    .exec(function(err, dish) {
      if (err || !dish) {
        req.flash('error', err.message);
        return res.redirect('back');
      }

      res.render('review/index', { dish: dish });
    });
});

// Reviews New
// middleware.checkReviewExistence checks if a user already reviewed the dish, only one review per user is allowed
/* router.get(
  '/new',
  middleware.isLoggedIn,
  middleware.checkReviewExists,
  function(req, res) {
    Dish.findById(req.params.id, function(err, dish) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      res.render('review/new', { dish: dish });
    });
  }
);
 */
router.get(
  '/new',
  middleware.isLoggedIn,
  middleware.checkDishExists,
  middleware.checkReviewExists,
  review.getNewReview
);

// Reviews Create
router.post('/', middleware.isLoggedIn, middleware.checkReviewExists, function(
  req,
  res
) {
  Dish.findById(req.params.id)
    .populate('reviews')
    .exec(function(err, dish) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      Review.create(req.body.review, function(err, review) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        //add author username/id and associated dish to the review
        review.author.id = req.user._id;
        review.author.username = req.user.username;
        review.dish = dish;
        //save review
        review.save();
        dish.reviews.push(review);
        // calculate the new average review for the dish
        dish.rating = calculateAverage(dish.reviews);
        //save dish
        dish.save();
        req.flash('success', 'Your review has been successfully added.');
        res.redirect('/dishes/' + dish._id);
      });
    });
});

// Reviews Edit  reviews/5dba711a74c31463a57ce407/edit
router.get('/:review_id/edit', middleware.checkReviewOwnership, async function(
  req,
  res
) {
  const dish = await Dish.findById(req.params.id);

  Review.findById(req.params.review_id, function(err, foundReview) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    console.log(foundReview);
    res.render('review/edit', { dish: dish, review: foundReview });
  });
});

// Reviews Update
router.put('/:review_id', middleware.checkReviewOwnership, function(req, res) {
  Review.findByIdAndUpdate(
    req.params.review_id,
    req.body.review,
    { new: true },
    function(err, updatedReview) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      Dish.findById(req.params.id)
        .populate('reviews')
        .exec(function(err, dish) {
          if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          // recalculate dish average
          dish.rating = calculateAverage(dish.reviews);
          //save changes
          dish.save();
          req.flash('success', 'Your review was successfully edited.');
          res.redirect('/dishes/' + dish._id);
        });
    }
  );
});

// Reviews Delete
router.delete('/:review_id', middleware.checkReviewOwnership, function(
  req,
  res
) {
  Review.findByIdAndRemove(req.params.review_id, function(err) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // pull removes the reference of the review from dish's array
    Dish.findByIdAndUpdate(
      req.params.id,
      { $pull: { reviews: req.params.review_id } },
      { new: true }
    )
      .populate('reviews')
      .exec(function(err, dish) {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        // recalculate dish average
        dish.rating = calculateAverage(dish.reviews);
        //save changes
        dish.save();
        req.flash('success', 'Your review was deleted successfully.');
        res.redirect('/dishes/' + req.params.id);
      });
  });
});

function calculateAverage(reviews) {
  if (reviews.length === 0) {
    return 0;
  }
  var sum = 0;
  reviews.forEach(function(element) {
    sum += element.rating;
  });
  return sum / reviews.length;
}

module.exports = router;
