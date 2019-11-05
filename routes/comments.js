const express     = require("express");
const router      = express.Router({mergeParams: true});
const Place       = require("../models/place");
const Comment     = require("../models/comment");
const middleware    = require("../middleware") // will require index.js automatically
 
// ==========================
// Comments Routes
// ==========================
// Comments New
router.get("/places/:id/comments/new", middleware.isLoggedIn, (req, res) => {
    Place.findById(req.params.id, (err, place) => {
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {place: place});
        };
    });
});

// Comments Create
router.post("/places/:id/comments", middleware.isLoggedIn, (req, res) => {
    // lookup place using id
    // create new comment
    // connect new comment to place
    // redirect place show page
    Place.findById(req.params.id, (err, place) => {
        if(err){
            console.log(err);
            res.redirect("/places");
        } else {
            Comment.create(req.body.comment, (err, comment) => {
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else {
                    // add username and id into comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    // save comment
                    comment.save();
                    place.comments = place.comments.concat([comment]);
                        place.save(function(err, savedPlace){
                            if(err){
                                console.log(err);
                            } else {
                                // console.log(savedPlace);
                                req.flash("success", "Succesfully added a comment");
                                res.redirect("/places/" + place._id);
                            };
                        });
                }
            });
        };
    });
});

// Comments Edit Route
router.get("/places/:id/comments/:comment_id/edit", middleware.checkCommentOwnership,  (req, res) => {
    Place.findById(req.params.id, (err, foundPlace) => {
        if(err || !foundPlace){
            req.flash("error", "No Place found!");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if(err) {
                res.redirect("back");
            } else {
                res.render("comments/edit", { place_id: req.params.id, comment: foundComment });
            }
        }); 
    });    
});

// Comments Update Route
router.put("/places/:id/comments/:comment_id", middleware.checkCommentOwnership,(req, res) => {
    // find and update the correct comment 
    // redirect show page
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else {
            // res.redirect("/places/" + updatedPlace._id); // also works
            res.redirect("/places/" + req.params.id);
        }
    });
});

// Comments Destroy Route
router.delete("/places/:id/comments/:comment_id", middleware.checkCommentOwnership, (req,res) => {
    Comment.findByIdAndRemove(req.params.comment_id, function(err, commentRemoved){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } else {
            // remove the comment from the Place comments array also
            Place.findById(req.params.id, function(err, place){
                if(err) {
                    req.flash("error", "Comment was not deleted from comments array");
                    console.log(err);
                } else {
                    const idx = place.comments.indexOf(commentRemoved._id);
                    place.comments.splice(idx, 1);
                    place.save(function(err, savedPlace2){
                        if(err){
                            req.flash("error", "Comment was not deleted from comments array");
                            console.log(err);
                        } 
                    });
                };  
            }); 
            req.flash("success", "Succesfully deleted a comment");
            res.redirect("/places/" + req.params.id);
        }
    });
});   

module.exports = router;
  