'use strict'

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var port    = process.env.PORT || 8080;
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

//user schema
var UserSchema = new Schema({
    username: String,
    email:String,
    password: String
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema);

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
app.get('/:username/add',function(req,res){
	res.render('add');
});

app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});

app.listen(port);
console.log('The magic happens on port ' + port);