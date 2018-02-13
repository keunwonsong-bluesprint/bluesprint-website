var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var facebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bkfd2Password = require("pbkdf2-password");
var hasher = bkfd2Password();
//User-Defined Mods
var db = require('./scripts/db/db.js');

var dbConn = db.GetDBConnection();
var app = express();
app.use(express.static('public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: false }));
/*
app.use(session({
  secret: '1234DSFs@adf1234!@#$asd',
  resave: false,
  saveUninitialized: true,
  store:new MySQLStore({
    host:'bsdbinstance.cyegx2npbbxr.ap-northeast-2.rds.amazonaws.com',
    port:3306,
    user:'bluesprint',
    password:'bluesprint',
    database:'bluesprintdb'
  })
}));
*/
app.use(passport.initialize());
app.use(passport.session());


app.get('/', function(req, res){
	res.send('index');
});

app.get('/signup', function(req, res){
	res.render("signup");
});

passport.serializeUser(function(user, done) {
	console.log("=========serializeUser==============");
	done(null, user.authId);
});

passport.deserializeUser(function(id, done) {
	console.log("=========deserializeUser==============", id);

	db.GetUser(id, result=>{
		if(result != false){
			var user = result;
			done(null, user);
		}
		else{
			done('deserializeUser Failed');
		}
	});
});

passport.use(new localStrategy(
	function (username, password, done){
		var uname = username;
		var pwd = password;
		db.GetUser(['local:'+uname], result =>{
			if(result != false){
				var user = result;
				console.log("--------------------localStrategy : " , user);
				console.log("--------------------localStrategy");
				hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash){
					console.log("=================================");
					console.log(hash);
					console.log(user.password);
					if(hash === user.password){
						console.log(uname, "Login Success");

						return done(null, user);						
					}
					else{
						console.log(uname, "Login Failed");
						return done(null, false);
					}
				});

			}
			else{
				return done(null, false);
			}

		});
	}
));

passport.use(new facebookStrategy({
    clientID: '800910830094285',
    clientSecret: 'f0007bf5d0b62c06e216bded55c3a266',
    callbackURL: "/auth/facebook/callback",
    profileFields:['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified', 'displayName']
  },
  function(accessToken, refreshToken, profile, done) {
  	console.log(profile);
  	var authId = 'facebook:' + profile.id;
    // User.findOrCreate(..., function(err, user) {
    //   if (err) { return done(err); }
    //   done(null, user);
    // });
  }
));

app.post('/auth/register', function(req, res){
  hasher({password:req.body.password}, function(err, pass, salt, hash){
    var user = {
      authId:'local:'+req.body.username,
      username:req.body.username,
      password:hash,
      salt:salt,
      displayName:req.body.displayName
    };
    console.log('/auth/register :' , user);

    db.UserRegister(user, result  =>{
    	console.log('UserRegister', result);

    	if(result){
    		res.redirect('/welcome');
    	}
    	else{
    		res.send('Register Failed');
    	}	
    });

  });
});

app.post('/auth/login', 
	passport.authenticate('local', { successRedirect: '/welcome',
                                   failureRedirect: '/loginfail',
                                   failureFlash: true })
	);


app.get('/auth/facebook', 
	passport.authenticate('facebook',
	{scope:'email'}));
	
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/welcome',
                                      failureRedirect: '/loginfail' }));

app.get('/auth/logout', function(req, res){
	req.logout();
	req.session.save(function(){
		res.redirect('../index.html');
	});

});


app.get('/welcome', function(req, res){
  if(req.session.displayName) {
    res.send(`
      <h1>Hello, ${req.session.displayName}</h1>
      <a href="/auth/logout">logout</a>
    `);
  } else {
    res.send(`
      <h1>Welcome</h1>
      <a href="/auth/login">Login</a>
    `);
  }
});

app.get('/loginfail', function(req, res){
		res.send(`
      <h1>Login Failed</h1>
    `);
});

app.listen(7777, function(){
	console.log('BlueSprint Web Start');
});
