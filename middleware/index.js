Place       = require("../models/place");
Comment     = require("../models/comment");

// all the middleware goes here
var middlewareObj = {};

middlewareObj.checkPlaceOwnership = function(req, res, next){
    // is user logged in
    // if yes then
        // does user owns the place
            // if not owns then redirect
            // if yes owns then continue
    // if not then redirect
    if(req.isAuthenticated()){
        Place.findById(req.params.id, (err, foundPlace) => {
            if(err) { 
                req.flash("error", "Place not found");
                res.redirect("back");
            } else {
                // To fix problem when someone changes url characters of the 
                // place._id in the browser.
                // Added this block, to check if foundPlace exists, 
                // and if it doesn't to throw an error via connect-flash 
                // and send us back to the homepage
                if (!foundPlace) {
                    req.flash("error", "Place not found.");
                    return res.redirect("back");
                }
                // If the upper condition is true this will break out of 
                // the middleware and prevent the code below to crash our 
                // application
                if(foundPlace.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "You do not have permission to do that");
                    res.redirect("back");
                }   
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    };
};

middlewareObj.checkCommentOwnership = function(req, res, next){
    // if user logged in?
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                // if error then go back
                req.flash("error", "Comment not found.");
                res.redirect("back");
            } else {
                // In case someone messes with the comment_id in the browser url
                // manually.
                // Added this block, to check if foundComment exists, 
                // and if it doesn't to throw an error via connect-flash 
                // and send us back to the homepage
                if (!foundComment) {
                    req.flash("error", "Comment not found.");
                    return res.redirect("back");
                }
                // If the upper condition is true this will break out of 
                // the middleware and prevent the code below to crash our 
                // application
                // does user owns the comment?
                if(foundComment.author.id.equals(req.user._id)){
                    // if user owns it then continue
                    next();
                } else {
                    // if user does NOT owns it the go back
                    req.flash("error", "You do not have permission to do that");
                    res.redirect("back");
                };
            };
        });
    } else {
        // otherwise, redirect
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }; 
};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    };
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

module.exports = middlewareObj;