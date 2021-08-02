var express 			  = require('express');
var app 				  = express();
var mongoose 			  = require('mongoose'),
	bodyParser  		  = require('body-parser'),
	flash				  = require('connect-flash')
	Comment 			  = require('./models/comments.js'),
	campground  		  = require('./models/campground.js'),
	User 				  = require('./models/user.js'),
	methodOverride 		  = require('method-override'),
	passport 			  = require('passport'),
	LocalStrategy 		  = require('passport-local'),
	passportLocalMoongose = require('passport-local-mongoose');
	// Connecting to database
mongoose.connect("mongodb://localhost:27017/campground",function(err){
	if(err){
		console.log("err");
	}
	});
//creating user session
app.use(require('express-session')({
	secret:"true",
	resave: false,
	saveUninitialized: false
}));
//setting up passport
app.use(flash());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//setting the usage of varioud functionalities
app.set("view engine","ejs");//to use ejs files
app.use(bodyParser.urlencoded({extended:true}));//to get the data entered by user via req.body
app.use(express.static(__dirname + '/public'));//with this all files in public dir will be accessible
//HomePage
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
	res.locals.currentUser =  req.user;
	next();
})


app.get("/",function(req,res){
	res.render("homepage");
});
//Campground Show page
app.get("/campgrounds",function(req,res){
	campground.find({},function(err,campgrounds){
		if(err){
			console.log(err);
		}
		res.render("index",{campgrounds:campgrounds});

	})
	});
//Campground create new page working
app.post("/campgrounds",isLoggedIn,function(req,res){
	campground.create(req.body.campground,function(err,newCampground){
		if(err){
			console.log(err);
		}
		newCampground.author.id = req.user._id;
		newCampground.author.username = req.user.username;
		newCampground.save();


	});
	res.redirect("/campgrounds");

});
app.get("/campgrounds/new",isLoggedIn,function(req,res){
	res.render("new");
});
//one Campground SHow page
app.get("/campgrounds/:id/show",function(req,res){
	campground.findById(req.params.id).populate("comments").exec(function(err,found){
			if(err){
				console.log("err");
			}
		res.render("show",{found:found});

	});
});
//Campground edit page
app.get("/campgrounds/:id/edit",checkCampgroundOwnerShip,function(req,res){
	campground.findById(req.params.id,function(err,edit){
			if(err){
				console.log(err);
			}
			res.render("edit",{edit:edit});
	});

});
app.put("/campgrounds/:id",function(req,res){
	campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err){
		if(err){
			console.log(err);
		}
		res.redirect("/campgrounds/" + req.params.id + "/show");
	});
});
//Destroy Route
app.delete("/campgrounds/:id",function(req,res){
	campground.findByIdAndRemove(req.params.id,function(err){
		if(err){
			console.log(err);
		}

		res.redirect("/campgrounds");
	});
});

//Comments new and create route
app.get("/campgrounds/:id/comment/new",isLoggedIn,function(req,res){
	res.render('comment',{Id:req.params.id});
});
app.post("/campgrounds/:id/comment",function(req,res){
	campground.findById(req.params.id,function(err,Campground){
		if(err)
		{
			console.log(err);
		}
		Comment.create(req.body.comment,function(err,comment){
			if(err)
			{
				console.log(err);
			}
			comment.author.id = req.user._id;
			comment.author.username = req.user.username;
			comment.save();
			Campground.comments.push(comment);
			Campground.save();
			res.redirect('/campgrounds/' + req.params.id + "/show");
		})
	});
});
//comment edit and update route
app.get("/campgrounds/:id/comment/:comments_id/edit",checkCommentOwnerShip,function(req,res){
	Comment.findById(req.params.comments_id,function(err,foundComment){
		if(err){
			console.log(err);
		}else{

		res.render("commentedit",{Id:req.params.id,comment:foundComment});
	}
	})

});
app.put("/campgrounds/:id/comment/:comments_id",function(req,res){
	Comment.findByIdAndUpdate(req.params.comments_id,req.body.comment,function(err,UpdateComment){
		if(err){
			console.log(err);
		}
		else{
			res.redirect("/campgrounds/" + req.params.id + "/show");
		}
	});
});
//Destroy route
app.delete("/campgrounds/:id/comment/:comments_id",checkCommentOwnerShip,function(req,res){
	Comment.findByIdAndRemove(req.params.comments_id,function(err){
		if(err){
			console.log(err);
		}
		res.redirect("/campgrounds/" + req.params.id + "/show")
	});
});
//=============Authentication Routes=============
app.get("/campgrounds/signup",function(req,res){
	res.render("signup");
});
app.post("/campgrounds/signup",function(req,res){
		User.register(new User({username: req.body.username}),req.body.password,function(err,user){
			if(err){
				console.log(err);
				res.redirect("signup");
			}
			else{
				passport.authenticate("local")(req,res,function(){
					res.redirect('/campgrounds');
				});
			}
		});

});
app.get("/campgrounds/login",function(req,res){
	res.render("logn",{message: req.flash("err")});

});
app.post("/campgrounds/login",passport.authenticate("local",{
	successRedirect:"/campgrounds",
	failureRedirect:"/campgrounds/login"
}),function(req,res){

});
app.get("/campgrounds/logout",function(req,res){
	req.logout();
	res.redirect("/campgrounds");
});

function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
			req.flash("err","Please Log In first");
			res.redirect("/campgrounds/login");
}
function checkCampgroundOwnerShip(req,res,next){
	if(req.isAuthenticated()){
		campground.findById(req.params.id,function(err,found){
			console.log(found.author.id);
			if(err){
				flash("err","Please Log In first");
				res.redirect("/campgrounds/login");
			}
			else
			{
				if(found.author.id.equals(req.user._id)){
					return next();
				}
				else{
					res.redirect("back");
				}
			}
		});
	}
	else{
		res.send("Login first");
	}

}
function checkCommentOwnerShip(req,res,next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comments_id,function(err,found){
			if(err){
				res.redirect("/");
			}
			else
			{
				if(found.author.id.equals(req.user._id)){
					return next();
				}
				else{
					res.send("Access denied");
				}
			}
		});
	}
}
app.listen(8080,function(err){
	if(err)
		console.log(err);
	else
		console.log("YelpCamp server has started....");
});
