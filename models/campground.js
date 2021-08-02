var mongoose = require('mongoose');
var campgroundSchema = new mongoose.Schema({
	title: String,
	body: String,
	image: String,
	author:{
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	//This is a comment object associated with campground.
	create: {type: Date, default: Date.now},
	comments: [
		{
		type: mongoose.Schema.Types.ObjectId,
		ref:"Comments"
		}
	]
});
module.exports = mongoose.model("Campground",campgroundSchema);