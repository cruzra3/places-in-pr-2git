var mongoose                = require("mongoose");
var passportLocalMongoose   = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String
});
 
UserSchema.plugin(passportLocalMongoose);

const User      = mongoose.model("User", UserSchema);
module.exports  = User;