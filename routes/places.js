const express       = require("express");
const mongoose      = require("mongoose");
const router        = express.Router({mergeParams: true});
const Place         = require("../models/place");
const Comment       = require("../models/comment");
const middleware    = require("../middleware") // will require index.js automatically

// start image upload configuration 
// start multer setup
var multer = require('multer');

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    // create a custom name for uploaded file
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only, the file name must have one of the
    // accepted file name extensions below
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
// here we pass the multer diskStorage and the imageFilter to the 
// upload variable 
var upload = multer({ storage: storage, fileFilter: imageFilter});
// end multer setup 

// start cloudinary setup
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'rac-files', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
// end cloudinary setup
// end image upload configuration 


// INDEX - show all places
router.get("/places", (req, res) => {
    let noMatch = null;
    if(req.query.search){
        // Get searched places from DB
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Place.find({name: regex}, (err, allPlaces) => {
            if (err) {
                console.log(err);
            } else {
                if(allPlaces.length < 1){
                    noMatch = "No Place matches that search query, please try again.";
                } 
                res.render("places/index", { places: allPlaces, noMatch: noMatch }); 
            };
        });
    } else {
        // Get all places from DB
        Place.find({}, (err, allPlaces) => {
            if (err) {
                console.log(err);
            } else {
                res.render("places/index", { places: allPlaces, noMatch: noMatch});
            };
        });
    }
 
});

// NEW - show form to create new place
router.get("/places/new", middleware.isLoggedIn, (req, res) => {
    res.render("places/new");
});

// CREATE - add new place to DB
router.post("/places", middleware.isLoggedIn, upload.single('image'), (req, res) => {
    cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        } 
        // add cloudinary url for the image to the place object under image property
        // read npm cloudinary documentation for more information on this
        req.body.place.image = result.secure_url;
        // add image's publicId to place object
        req.body.place.imageId = result.public_id;
        // add author to place
        req.body.place.author = {
            id: req.user._id,
            username: req.user.username
        }
        Place.create(req.body.place, function (err, place) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.redirect('/places/' + place.id);
        });
    });
}); 
  
// SHOW - shows more info about a specific place
router.get("/places/:id", (req, res) => {
    Place.findById(req.params.id).populate("comments").exec((err, foundPlace) => {
        if(err || !foundPlace){
            req.flash("error", "Place not found")
            console.log(err);
            res.redirect("back")
        } else {
            res.render("places/show", {place: foundPlace});
        }
    }); 
});

// EDIT - place route
router.get("/places/:id/edit", middleware.checkPlaceOwnership, (req, res) => {
    Place.findById(req.params.id, (err, foundPlace) => {
        res.render("places/edit", {place: foundPlace});
    });
});

// UPDATE - place route
router.put("/places/:id", middleware.checkPlaceOwnership, upload.single('image'), (req, res) => {
    // find and update the correct place 
    // redirect show page
    Place.findById(req.params.id, async function (err, place) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(place.imageId);
                    let result =  await cloudinary.v2.uploader.upload(req.file.path);
                    place.imageId = result.public_id;
                    place.image = result.secure_url;
                } catch(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }                
            }
            place.name = req.body.place.name;
            place.description = req.body.place.description;
            place.save();
            req.flash("success", "Succesfully Updated!");
            res.redirect("/places/" + place._id);
        }
    });
});

// DESTROY - place route and the associated comments
router.delete("/places/:id", middleware.checkPlaceOwnership, (req, res) => {
    //=========================================
    // locate place to remove
    // delete the image in cloudinary server
    // check if there is any comments to delete
    // if there are comments then  
    // read comments array one by one
    // convert id strings to real ids
    // delete all comments one by one
    // delete place next
    //=========================================
    var placeId = req.params.id;
    Place.findById(req.params.id, async function (err, placeToRemove) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        if (!placeToRemove) {
            req.flash("error", "Place not found.");
            return res.redirect("back");
        }
        try {
            // delete the image in cloudinary server
            await cloudinary.v2.uploader.destroy(placeToRemove.imageId);
            console.log("==========================================================================");
            console.log("Deleted the place image from cloudinary server => " + placeToRemove.image);
            console.log("==========================================================================");
        } catch (err) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
        }
        console.log("==================================================");
        console.log("Found place to delete: " + placeToRemove);
        console.log("==================================================");
        var count = 0;
        var commentsCount = placeToRemove.comments.length;
        // delete comments only if there is any comments 
        if (commentsCount >= 1) {
            console.log("==================================================");
            console.log("First delete following place comments: " + placeToRemove.comments);
            console.log("==================================================");
            placeToRemove.comments.forEach(function (comment) {
                var id = mongoose.Types.ObjectId(comment);
                Comment.findByIdAndRemove(id, function (err, commentRemoved) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("==================================================")
                        console.log("comment removed: " + commentRemoved);
                        console.log("==================================================")
                        count++
                        // if all comments deleted then delete place
                        if (count === commentsCount) {
                            console.log("==================================================")
                            console.log("Now delete this place: " + placeToRemove.name);
                            console.log("==================================================")
                            deletePlace(placeId);
                            res.redirect("/places");
                        };
                    };
                });
            });
        } else {
            deletePlace(placeId);
            res.redirect("/places");
        };

    });
});

function deletePlace(placeId) {
    Place.findByIdAndRemove(placeId, function (err, placeRemoved) {
        if (err) {
            console.log(err);
        } else {
            if (!placeRemoved) {
                req.flash("error", "Place not found.");
                return res.redirect("back");
            }
            console.log("==================================================")
            console.log("Place succesfully removed: " + placeRemoved);
            console.log("==================================================")
        };
    });
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;