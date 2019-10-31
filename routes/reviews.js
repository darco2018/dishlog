var express = require('express');
var router = express.Router({ mergeParams: true });
var Dish = require('../models/dish');
var Review = require('../models/review');
var middleware = require('../middleware');

// Reviews Index - display reviews for a given DISH
router.get('/', function(req, res) {
 
    //IMPORTANT! Replace id with req.params.id 
  Dish.findById("5d999dbd4029930fa9e8ebd3").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, dish) {
        
        if (err || !dish) {
            req.flash("error", err.message);
            return res.redirect("back");
        }        
        
        res.render("review/index", {dish: dish});
    });
});

module.exports = router;