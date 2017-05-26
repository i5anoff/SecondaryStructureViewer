// import npm modules

var express = require('express');
var app = express();
var stylus = require('stylus');
var fs = require('fs');
var glob = require('glob');
var bodyParser = require('body-parser')
var path = require('path')
//var Promise = require('bluebird');
var levelup = require('levelup')
var db = levelup('./mydb')
//var redis = Promise.promisifyAll(require("redis"));
var uuidV4 = require('uuid/v4'); 

app.use(bodyParser.json());
//app.use(express.bodyParser());
app.use(express.static('views'));
app.use(express.static('public'));
// render index.jade when user requests /
app.get('/', function(req, res) {
  res.sendFile('index.html');
})

app.get('/load/:uuid', function(req, res) {
	res.sendFile('index.html', { root: path.join(__dirname, 'views') });
});

app.get('/share/:uuid', function(req, res){
	db.get(req.params.uuid, function (err, value) {
		if (err) {
			console.log('Error in share/:uuid ', err);
			return res.send({err: err});
		}
		// ta da!
		return res.send(value);
	})
})

app.post('/share', function(req, res){
	//console.dir(req.body);
	var dataID = uuidV4();
	return db.put(dataID, JSON.stringify(req.body), function(err){
		if (err != undefined) {
			console.log(err);
			res.send({err: err});
			//res.end();
		}
		console.log("sent: ", dataID, JSON.stringify(req.body).length);
		res.send({id: dataID});
		//res.end();
	})
})

// listen on port 5000 for connections
app.listen(process.env.PORT || 5000, function() {
	console.log('listening on port 5000');
})



