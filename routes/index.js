const express     = require("express");
const router      = express.Router({mergeParams: true});
const passport    = require("passport"); 
const User        = require("../models/user"); 
const middleware  = require("../middleware") // will require index.js automatically
 
// Root route
router.get("/", (req, res) => {
    res.render("landing");
});

// show register form
router.get("/register", (req, res) => {
    res.render("register");
});

// handle sign up logic
router.post("/register", (req, res) => {
    const newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            req.flash("error", err.message);
            console.log(err);
            // the following return will short circuit us out from the callback
            return res.redirect("/register");
        }   
        // passport.authenticate("Facebook")(req, res, function(){
        // passport.authenticate("twitter")(req, res, function(){
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
            res.redirect("/places");
        });
     
    });
});

// show login form
router.get("/login", (req, res) => {
    res.render("login");
});

// handle login logic
router.post("/login", passport.authenticate("local", 
{
    successRedirect: "/places",
    failureRedirect: "/login"}), (req, res) => {
});

// logout route
router.get("/logout", function(req, res){
    req.logout();
    req.flash("error", "Logged You Out!!!");
    res.redirect("/places");
});

module.exports = router;