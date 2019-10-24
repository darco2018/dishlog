/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
const express = require('express');
const mongoose = require('mongoose');
const Dish = require('../models/dish');
const foodplace = require('../models/foodplace');
const Foodplace = foodplace.foodplaceModel;
const middleware = require('../middleware'); //index.js is imported by default from middleware folder

const router = express.Router();
const defaultImageUrl = '/images/default.jpg';
const allowedDishNameLength = 49;
const allowedIntroDescriptionLength = 66;
const allowedDescriptionLength = 2000;

/* redirect */

function handleError(req, res, error, message, page) {
  console.log(error);
  req.flash('error', message ? message : '');
  res.redirect(page);
}

function addDefaultImage(dish) {
  dish.image = !dish.image ? defaultImageUrl : dish.image;
  return dish;
}

function trimDishName(foundDish) {
  foundDish.name = !foundDish.image ? defaultImageUrl : foundDish.image;
}

/* ------------------------- ROUTES ------------------------------- */

// /dishes
// INDEX - show all dishes
router.get('/', async (req, res) => {
  try {
    let dishes = await Dish.find()
      .populate('foodplace')
      .populate('comments')
      .exec(); //returns full-fledged Promise in mongoose

    dishes = await addLatestCommentTo(dishes);

    res.render('dish/index', {
      dishes: dishes,
      page: 'dishes',
      allowedDishNameLength: allowedDishNameLength,
      allowedIntroLength: allowedIntroDescriptionLength
    });
  } catch (err) {
    return flashAndRedirect(
      req,
      res,
      'error',
      `Error. Cannot load the dishes. Reason: ${err.message}`,
      `back`
    );
  }
  /* 2ND VERSION: const promise = fn.then(val=>{//process val; return sth}).catch(err) 
  Dish.find()
    .populate('foodplace')
    .populate('comments')
    .then(dishes => addLatestCommentTo(dishes))
    .then(dishes => {
      res.render('dish/index', {
        dishes: dishes,
        page: 'dishes',
        allowedDishNameLength: allowedDishNameLength,
        allowedIntroLength: allowedIntroDescriptionLength
      });
    })
    .catch(err => {
      return flashAndRedirect(
        req,
        res,
        'error',
        `Error: cannot load the dishes (${err.message})`,
        `back`
      );
    });
     */
});

// NEW - show form to create new dish
// /dishes/new
router.get('/new', middleware.isLoggedIn, async (req, res) => {
  try {
    let foodplaces = await Foodplace.find().exec();
    res.render('dish/new', { foodplaces: foodplaces });
  } catch (err) {
    return flashAndRedirect(
      req,
      res,
      'error',
      `Error. Cannot show the form. Reason: ${err.message}`,
      `back`
    );
  }
  /* 
  Foodplace.find({}, (err, foundFoodplaces) => {
    if (err) {
      handleError(req, res, err, 'Something went wrong...', 'back');
    } else {
      res.render('dish/new', { foodplaces: foundFoodplaces });
    }
  }); */
});

// CREATE - add new dish
// /dishes
router.post('/', middleware.isLoggedIn, (req, res) => {
  const author = {
    id: req.user.id,
    username: req.user.username
  };
  const newDish = {
    foodplace: req.body.foodplaceId,
    name: req.body.name,
    price: req.body.price,
    image: req.body.image,
    description: req.body.desc.substring(0, allowedDescriptionLength),
    author: author
  };

  addDefaultImage(newDish);

  Dish.create(newDish, (err, savedDish) => {
    if (err) {
      handleError(req, res, err, 'Something went wrong...', 'back');
    } else {
      // increment dish count in foodplace
      const foodplaceId = savedDish.foodplace;
      Foodplace.findOneAndUpdate(
        { _id: foodplaceId },
        { $inc: { dishesCount: 1 } }
      )
        .exec()
        .then(() => {
          return flashAndRedirect(
            req,
            res,
            'success',
            'Successfully created a new dish...',
            `/dishes/${savedDish.id}`
          );
        })
        .catch(err => {
          return flashAndRedirect(
            req,
            res,
            'error',
            `Foodplace not found (${err.message})`,
            'back'
          );
        });

      //res.redirect('/dishes');
    }
  });
});

// SHOW - show details about dish
// dishes/234
// must be below /new
router.get('/:id', async (req, res) => {
  try {
    let dish = await Dish.findById(req.params.id)
      .populate('foodplace')
      .populate('comments')
      .exec();

    dish = await addDefaultImage(dish);

    res.render('dish/show', {
      dish: dish,
      allowedDishNameLength: allowedDishNameLength
    });
  } catch (err) {
    return flashAndRedirect(
      req,
      res,
      'error',
      `Error. Cannot find the dish. Reason: ${err.message}`,
      'back'
    );
  }
  /* 
  Dish.findById(req.params.id)
    .populate('foodplace')
    .populate('comments') // populate the comments array in a dish !!!
    .exec((err, foundDish) => {
      if (err || !foundDish) {
        handleError(req, res, err, 'Dish not found', '/dishes');
      } else {
        addDefaultImage(foundDish);
        res.render('dish/show', {
          dish: foundDish,
          allowedDishNameLength: allowedDishNameLength
        });
      }
    });*/
});

// EDIT - show edit form
// dishes/234/edit
router.get('/:id/edit', middleware.checkDishOwnership, async (req, res) => {
  try {
    let dish = await Dish.findById(req.params.id)
      .populate('foodplace')
      .exec();

    let foodplaces = await Foodplace.find().exec();

    res.render('dish/edit', {
      dish: dish,
      foodplaces: foodplaces
    }); //refactor with  res.locals.dish/foundDish
  } catch (err) {
    return flashAndRedirect(
      req,
      res,
      'error',
      `Error. Cannot show the edit form. Reason: ${err.message}`,
      'back'
    );
  }
  /* 
  Dish.findById(req.params.id)
    .populate('foodplace')
    .exec((err, foundDish) => {
      if (err || !foundDish) {
        handleError(req, res, err, 'Dish not found', '/dishes');
      }

      Foodplace.find({}, (err, foundFoodplaces) => {
        if (err) {
          handleError(req, res, err, 'Something went wrong...', 'back');
        } else {
          res.render('dish/edit', {
            dish: foundDish,
            foodplaces: foundFoodplaces
          }); //refactor with  res.locals.dish/foundDish
        }
      });
    }); */
});

// UPDATE
// dishes/234/update
// add ?_method=PUT in url  (method-override)
router.put('/:id/update', middleware.checkDishOwnership, (req, res) => {
  // checkDishOwnership does checkDishExists first

  Dish.findByIdAndUpdate(
    req.params.id,
    // limit description length to (req.body.desc).substring(0, allowedDescriptionLength),
    req.body.dish, // thanks to dish[name]/[url]/[description] in view
    (err, updatedDish) => {
      if (err || !updatedDish) {
        handleError(req, res, err, 'Something went wrong...', 'back');
      } else {
        req.flash('success', 'Successfully updated the dish...');
        res.redirect(`/dishes/${updatedDish.id}`);
      }
    }
  );
});

// DESTROY - delete dish
// dishes/:id
// needs a FORM with post + method_override
router.delete(
  '/:id',
  middleware.checkDishOwnership, // does checkDishExists
  (req, res) => {
    Dish.findByIdAndDelete(req.params.id, (err, deletedDish) => {
      if (err) {
        handleError(req, res, err, 'Something went wrong...', 'back');
      } else {
        // decrement dish count in foodplace
        const foodplaceId = deletedDish.foodplace;
        Foodplace.findOneAndUpdate(
          { _id: foodplaceId },
          { $inc: { dishesCount: -1 } }
        ).exec();
        res.redirect('/dishes/');
      }
    });
  }
);

/* HELPERS */

function loadFoodplaces() {
  Foodplace.find({}, (err, foundFoodplaces) => {
    if (err) {
      handleError(req, res, err, 'Something went wrong...', 'back');
      return null;
    } else {
      return foundFoodplaces;
      //res.render('dish/new', { foodplaces: foundFoodplaces });
    }
  });

  return;
}

function findByIdAndUpdatePromise(id, foodplace) {
  return new Promise((resolve, reject) => {
    Foodplace.findByIdAndUpdate(id, foodplace, (err, updatedFoodplace) => {
      if (err || !updatedFoodplace) {
        reject('Error: Cannot update the foodplace...');
      } else {
        resolve(updatedFoodplace);
      }
    });
  });
}

function flashAndRedirect(req, res, flashStatus, flashMsg, url) {
  req.flash(flashStatus, flashMsg);
  res.redirect(url);
}

function addLatestCommentTo(dishes) {
  dishes.forEach(dish => {
    let latestComment = dish.comments[0];
    dish.latestCommentAt = latestComment ? latestComment.createdAt : '';
  });
  return dishes;
}

module.exports = router;
