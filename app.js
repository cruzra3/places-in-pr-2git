const express                   = require("express");
const bodyParser                = require("body-parser");
const mongoose                  = require("mongoose");
const flash                     = require("connect-flash");
const seedDB                    = require("./seeds");
const Place                     = require("./models/place");
const Comment                   = require("./models/comment");
const User                      = require("./models/user");
const expressSession            = require("express-session");
const passport                  = require("passport");
const LocalStrategy             = require("passport-local");
const methodOverride            = require("method-override");
const passportLocalMongoose     = require("passport-local-mongoose");
const dotenv                    = require("dotenv");
const app                       = express();

// load environment variables
dotenv.config();
 
const url = process.env.DATABASEURL || 'mongodb://localhost:27017/places_in_pr';
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false });

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

// seedDB(); // seed the database

// requiring routes    
let commentRoutes       = require("./routes/comments"),
    placeRoutes         = require("./routes/places"),
    indexRoutes         = require("./routes/index"); 

app.locals.moment = require('moment');
// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Me siento poderoso en el dia de hoy, gracias a Dios",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// END PASSPORT CONFIGURATION

app.use((req, res, next) => {
    // make req.user from the request available in all views templates
    // under the name currentUser, which includes 'currentUser.username' 
    // and 'currentUser._id'
    res.locals.currentUser  = req.user;
    res.locals.error        = req.flash("error");
    res.locals.success      = req.flash("success");
    next();
});

// ??? see video345
app.use(indexRoutes);
app.use(placeRoutes);
app.use(commentRoutes);

// Server listener logic
if(process.env.PORT && process.env.PORT > 0){

    app.listen(process.env.PORT, process.env.IP, function(){
        console.log("Server has Started on port " + process.env.PORT + " and IP " + process.env.IP);
    });

} else {

    var processEnvPORT = 3000;
    var processEnvIP = '0.0.0.0';
    // var processEnvIP = 'localhost';
    app.listen(processEnvPORT, processEnvIP, function(){
        console.log("Server has Started on port " + processEnvPORT + " and IP " + processEnvIP);
    });

}