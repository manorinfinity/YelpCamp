var mongoose = require('mongoose');
var commentSchema = new mongoose.Schema({
		body : String,
		author:{
		id:{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	}	
});
module.exports = mongoose.model("Comments", commentSchema);