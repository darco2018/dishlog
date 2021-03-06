const express = require('express');
const router = express.Router();
const middleware = require('../middleware'); //index.js is imported by default from middleware folder
const foodplace = require('../controllers/foodplace.controller');

router.get('/', foodplace.getFoodplaces);

router.get('/new', middleware.isLoggedIn, foodplace.getNewFoodplace);

router.post('/', middleware.isLoggedIn, middleware.upload.single('image'), foodplace.postFoodplace);

// /map must be above /:id
router.get('/map', foodplace.showFoodplacesOnMap);

router.get('/:id', foodplace.showFoodplace);

router.get(
  '/:id/edit',
  middleware.isLoggedIn,
  middleware.checkFoodplaceExists,
  foodplace.editFoodplace
);

router.get(
  '/:id/dishes',
  middleware.checkFoodplaceExists,
  foodplace.showDishes
);

router.put(
  '/:id',
  middleware.isLoggedIn,
  middleware.checkFoodplaceExists,
  middleware.upload.single('image'),
  foodplace.putFoodplace
);

router.delete(
  '/:id',
  middleware.isLoggedIn,
  middleware.checkFoodplaceExists,
  foodplace.deleteFoodplace
);

module.exports = router;
