/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
const express = require('express');
const mongoose = require('mongoose');
const Dish = require('../models/dish');
const foodplace = require('../models/foodplace');
const Foodplace = foodplace.foodplaceModel;
//const middleware = require('../middleware'); //index.js is imported by default from middleware folder
const { flashAndRedirect } = require('../utils/index');

const router = express.Router();
const defaultImageUrl = '/images/default.jpg';
const allowedDishNameLength = 49;
const allowedIntroDescriptionLength = 66;
const allowedDescriptionLength = 2000;

/* ------------------------- ROUTES ------------------------------- */

const getDishes = async (req, res) => {
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
};

const getNewDish = async (req, res) => {
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
};

const postDish = async (req, res) => {
  //if (!req.user) throw new Error('You have to be logged in to do that!');
  try {
    let dish = await assembleDish(req);
    let savedDish = await Dish.create(dish);
    console.log('>>>>>>>>>> savedDish ' + savedDish);

    // increment dish count for the given foodplace
    const foodplaceId = savedDish.foodplace;
    console.log('>>>>>>>>>> foodplaceId ' + foodplaceId);
    await Foodplace.findOneAndUpdate(
      { _id: foodplaceId },
      { $inc: { dishesCount: 1 } }
    ).exec();
    console.log('>>>>>>>>>> savedDish.id ' + savedDish.id);

    return flashAndRedirect(
      req,
      res,
      'success',
      'Successfully created a new dish...',
      `/dishes/${savedDish.id}`
    );
  } catch (err) {
    return flashAndRedirect(
      req,
      res,
      'error',
      `Error creating a new dish. Reason: (${err.message})`,
      'back'
    );
  }
};

const showDish = async (req, res) => {
  try {
    let dish = await Dish.findById(req.params.id)
      .populate('foodplace')
      .populate('comments')
      .exec();

    res.render('dish/show', {
      dish: dish,
      allowedDishNameLength: allowedDishNameLength
    });
  } catch (err) {
    return flashAndRedirect(
      req,
      res,
      'error',
      `Error loading the dish. Reason: ${err.message}`,
      'back'
    );
  }
};

const editDish = async (req, res) => {
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
};

const putDish = async (req, res) => {
  // checkDishOwnership does checkDishExists first
  try {
    let dish = await assembleDish(req);
    let updated = await Dish.findByIdAndUpdate(req.params.id, dish).exec();

    return flashAndRedirect(
      req,
      res,
      'success',
      'Successfully updated the dish...',
      `/dishes/${updated.id}`
    );
  } catch (err) {
    return flashAndRedirect(
      req,
      res,
      'error',
      `Error. Cannot update the dish. Reason: ${err.message}`,
      'back'
    );
  }
};

const deleteDish = async (req, res) => {
  try {
    let deleted = await Dish.findByIdAndDelete(req.params.id).exec();
    const foodplaceId = deleted.foodplace;
    //decrease dish count for the given foodplace
    await Foodplace.findOneAndUpdate(
      { _id: foodplaceId },
      { $inc: { dishesCount: -1 } }
    ).exec();

    return flashAndRedirect(
      req,
      res,
      'success',
      'Successfully deleted the dish...',
      `/dishes/`
    );
  } catch (err) {
    return flashAndRedirect(
      req,
      res,
      'error',
      `Error when deleting the dish. Reason: ${err.message}`,
      '/dishes/'
    );
  }
};

/* HELPERS */

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

function addLatestCommentTo(dishes) {
  dishes.forEach(dish => {
    let latestComment = dish.comments[dish.comments.length - 1];
    dish.latestCommentAt = latestComment ? latestComment.createdAt : '';
  });
  return dishes;
}

function assembleDish(req) {
  if (!req) throw new Error('Cannot assemble a dish. Request is null.');

  let image = req.body.dish ? req.body.dish.image : req.body.image;
  image = !image ? defaultImageUrl : image;

  let description = req.body.dish
    ? req.body.dish.description
    : req.body.description;
  description = description.substring(0, allowedDescriptionLength);

  const author = {
    id: req.user.id,
    username: req.user.username
  };

  let dish = {
    foodplace: req.body.dish ? req.body.dish.foodplace : req.body.foodplaceId,
    name: req.body.dish ? req.body.dish.name : req.body.name,
    price: req.body.dish ? req.body.dish.price : req.body.price,
    image: image,
    description: description,
    author: author
  };

  return dish;
}

module.exports = {
  getDishes,
  getNewDish,
  postDish,
  showDish,
  editDish,
  putDish,
  deleteDish
};