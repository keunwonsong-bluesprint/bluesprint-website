var mysql = require('mysql');
var conn = null;
exports.GetDBConnection = function()
{
	conn = mysql.createConnection({
  		host:'bsdbinstance.cyegx2npbbxr.ap-northeast-2.rds.amazonaws.com',
		user     : 'bluesprint',
		password : 'bluesprint',
		database : 'bluesprintdb'
	});
	conn.connect();

	return conn;
};

exports.UserRegister = function(user, callback)
{
	console.log('UserRegister');
	if(conn == null)
	{ 
			console.log("DB Conn is Null");
			callback(false); 
	}
	else
	{		var sql = 'INSERT INTO users SET ?';
			console.log(sql);	
			conn.query(sql, user, function(err, results){
				if(err){
					console.log(err);
					callback(false); 
				}
				else{
					callback(true); 
				}
			})
	}
};

exports.GetUser = function(username, callback)
{
	console.log('GetUser');
	if(conn == null)
	{ 
			console.log("DB Conn is Null");
			callback(false); 
	}
	else
	{	var sql = 'SELECT * FROM users WHERE authId=?';
		console.log('GetUser : authId : ' , username);
		conn.query(sql, username, function(err, results){
			if(err || results[0] == undefined || results[0] == null) {
				console.log('err ', err);
				callback(false); 
			}
			else{
				console.log('GetUser', results[0]);
				callback(results[0]);
			}
		})
	}
};



