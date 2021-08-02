var mongoose = require('mongoose');
var LocalStrategy = require("passport-local-mongoose");
var UserSchema = new mongoose.Schema({
		username: String,
		password: String
	}); 
UserSchema.plugin(LocalStrategy);
module.exports = mongoose.model("User",UserSchema);