'use strict'

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var port    = process.env.PORT || 3000;
var passport    = require('passport');
var methodOverride = require('method-override');
var LocalStrategy = require('passport-local');
var router = express.Router();
var passportLocalMongoose = require("passport-local-mongoose");


mongoose.connect('mongodb://localhost/karanslist');

const Schema = mongoose.Schema;

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));

//user schema
var UserSchema = new Schema({
    username: String,
    email:String,
    date:{type:Date , default:Date.now},
    password: String
});

//ad schema
var adSchema = new Schema({
    name: String,
    perks:String,
    description: String,
    cat:String,
    location:String,
    time:String,
    author:{
   		id: {
   			type:mongoose.Schema.Types.ObjectId,
   			ref: "User"
   		},
   		username: String
   }
}); 

//apply schema
var appSchema = new Schema({
	name:String,
	email:String,
	phone:String,
	desc:String,
	by:String,
	author:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
			ref:"User"
		},
		username:String
	},
	appli:{
		id:{
			type:mongoose.Schema.Types.ObjectId,
   			ref: "Ad"
		}
	}
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);
const Ad = mongoose.model('Ad', adSchema);
const App = mongoose.model('App', appSchema);

app.use(require("express-session")({
    secret: "Hello There",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

//landing route
app.get('/',function(req,res){
   res.render('landing');
});
//register route
app.get('/register',function(req,res){
   res.render('register');
});

//get login page
app.get('/login',function(req,res){
	res.render('login');
});

//post login page
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/",
        failureRedirect: "/login"
    }), function(req, res){
});

//Into the database
app.post('/register',function(req,res){
   var newUser = new User({username: req.body.username,email:req.body.email});
   User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/"); 
        });
    });
});

//add ad
app.get('/:username/add',isLoggedIn,function(req,res){
	res.render('add');
});

//post ad
app.post('/:username/add',isLoggedIn,function(req,res){
	var newAd = {name:req.body.name,perks:req.body.perks,description:req.body.description,cat:req.body.cat,location:req.body.states,time:req.body.time,author:{id:req.user.id,username:req.user.username}};
	Ad.create(newAd,function(err,created){
		if(err){
			res.redirect('/'+req.user.username+'/myads');
		}else{
			console.log('created');
			res.redirect('/'+req.user.username+'/myads');
		}
	});
});

//show my ads
app.get('/:username/myads',isLoggedIn,function(req,res){
	Ad.find({'author.username':req.user.username},function(err,foundAuthorAll){
		if(err){
			res.redirect('/');
		}else{
			var millistamp = req.user.date;
			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		    var year = millistamp.getFullYear();
		    var month = months[millistamp.getMonth()];
		    var date = millistamp.getDate();
		    var formattedTime = month + ' ' + date + ', ' + year;
		    App.find({'author.username':req.user.username},function(err,no){
		    	if(err){
		    		console.log(err);
		    		res.redirect('back');
		    	}else{
		    		var no = no.length;
		    		res.render('myads',{foundAuthorAll:foundAuthorAll,no:foundAuthorAll.length,formattedTime:formattedTime,no:no});
		    	}
		    });
		}
	});
});

//show answered ads
app.get('/:username/answered',isLoggedIn,function(req,res){
	App.find({'author.username':req.user.username},function(err,no){
			    	if(err){
			    		console.log(err);
			    		res.redirect('back');
			    	}else{
			    		res.render('myansads',{no:no});
			    	}
			    });
	});

//show all ads
app.get('/allAds',function(req,res){
	Ad.find({},function(err,foundAll){
		if(err){
			res.redirect('/');
		}else{
			if(!req.user){
				res.render('allads',{foundAll:foundAll,no:foundAll.length});
			}else{
			App.find({by:req.user.username},function(err,applied){
				if(err){
					console.log(err);
					res.redirect('back');
				}else{
					res.render('allads',{foundAll:foundAll,no:foundAll.length,applied:applied});
				}
			});
		}
	   }		
	});
});

app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});

app.get('/categories',function(req,res){
	res.render('cat.ejs');
});

app.get('/cat/:cat',function(req,res){
	Ad.find({'cat':req.params.cat},function(err,foundCatAll){
		if(err){
			res.redirect('/');
		}else{
			res.render('catads',{foundCatAll:foundCatAll,cat:req.params.cat});
		}
	});
});

app.get('/user/:username',function(req,res){
	Ad.find({'author.username':req.params.username},function(err,foundAuthorAll){
		if(err){
			res.redirect('/');
		}else{
			res.render('author',{foundAuthorAll:foundAuthorAll,username:req.params.username});
		}
	});
});

app.get('/:username/myads/:id/edit',isLoggedIn,function(req,res){
	Ad.findById(req.params.id,function(err,foundAd){
		if(err){
			console.log(err);
			res.redirect('back');
		}else{
			res.render('edit',{foundAd:foundAd});
		}
	});
});

app.put('/:username/myads/:id',isLoggedIn,function(req,res){
    var updatedAd = {name:req.body.name,perks:req.body.perks,description:req.body.description,cat:req.body.cat,location:req.body.states,time:req.body.time,author:{id:req.user.id,username:req.user.username}};
    Ad.findByIdAndUpdate(req.params.id,updatedAd,function(err,updatedAd){
        if(err){
            console.log('Error found');
            console.log(err);
            res.redirect('back');
        }else{
            res.redirect('/'+req.user.username+'/myads');    
        }
    });
});

app.delete('/:username/myads/:id',isLoggedIn,function(req,res){
    Ad.findByIdAndRemove(req.params.id,function(err,removed){
        if(err){
            console.log('Error was there');
            console.log(err);
            res.redirect('/');
        }else{
        res.redirect('/'+req.user.username+'/myads');
        }
    });
});

app.get('/:username/edit/:id',isLoggedIn,function(req,res){
	User.findById(req.params.id,function(err,foundUser){
		if(err){
			res.redirect('back');
		}else{
			res.render('editprofile',{foundUser:foundUser});
		}
	});
});

app.put('/:username/edit/:id',isLoggedIn,function(req,res){
    var updatedUser = {username:req.body.name,email:req.body.email};
    User.findByIdAndUpdate(req.params.id,updatedUser,function(err,updatedUser){
        if(err){
            console.log('Error found');
            res.redirect('back');
        }else{
        	Ad.find({'author.username':req.params.username},function(err,foundAuthorAll){
				if(err){
					res.redirect('/'+req.user.username+'/myads');
				}else{
					// console.log(foundAuthorAll);
				   foundAuthorAll.forEach(function(foundAuthorOne){
				   	  foundAuthorOne.author.username=req.body.name;
				   	  foundAuthorOne.save(function(err,updatedOne){
				   	  	if(err){
				   	  		console.log(err);
				   	  	}else{
				   	  		console.log(foundAuthorOne);
				   	  	}
				   	  }); 
				   });	
				}
			});
			res.redirect('/');    
        }
    });
});

app.get('/:username/:userid/:adid/apply',isLoggedIn,function(req,res){
  App.find({by:req.params.username},function(applied){
  	console.log(applied);
  	if(!applied){
  		res.render('apply',{adid:req.params.adid,username:req.params.username,userid:req.params.userid});
  	}//else{
  		//console.log('You have already applied for this job');
  	//}	
  });	
});

app.get('/:username/myads/applied',isLoggedIn,function(req,res){
	App.find({'by':req.params.username},function(err,foundApp){
		if(err){
			res.redirect('back');
		}else{
			res.render('applied',{foundApp:foundApp});
		}
	});
});

app.post('/:username/:userid/apply/:adid',isLoggedIn,function(req,res){
			var newAppl = {name:req.body.name,email:req.body.email,phone:req.body.phone,desc:req.body.description,by:req.user.username,author:{id:req.params.userid,username:req.params.username},appli:{id:req.params.adid}};
			App.create(newAppl,function(err,created){
				if(err){
					res.redirect('/'+req.user.username+'/myads');
				}else{
					res.redirect('/'+req.user.username+'/myads/applied');
				}
			});
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(port);
console.log('The magic happens on port ' + port);