var express = require('express');
var multer = require('multer');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uploads = multer({dest:'uploads/'});
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var DBurl = "mongodb://localhost:27017/thoughtboard";
var X_MIN_BOUNDS = 0;
var X_MAX_BOUNDS = 100;
var Y_MIN_BOUNDS = 5;
var Y_MAX_BOUNDS = 96;
var callout_timeout = 10000;
//default starter dataset on clean install
var query = {question:"What does the Constitution Say?",thoughts:[
{x:5,y:75,vector:{x:1,y:7.1},height:"10%",width:"10%",message:"We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America."},
{x:50,y:7,vector:{x:3,y:2.1},height:"10%",width:"15%",message:"Section 1: All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives."},
{x:25,y:45,vector:{x:-7.6,y:5},height:"10%",width:"10%",message:"Section 2: The House of Representatives shall be composed of Members chosen every second Year by the People of the several States, and the Electors in each State shall have the Qualifications requisite for Electors of the most numerous Branch of the State Legislature."},
{x:5,y:95,vector:{x:4.2,y:-3.8},height:"5%",width:"10%",message:"No Person shall be a Representative who shall not have attained to the Age of twenty five Years, and been seven Years a Citizen of the United States, and who shall not, when elected, be an Inhabitant of that State in which he shall be chosen"},
{x:5,y:75,vector:{x:6.81,y:-7.1},height:"10%",width:"20%",message:"Representatives and direct Taxes shall be apportioned among the several States which may be included within this Union, according to their respective Numbers, which shall be determined by adding to the whole Number of free Persons, including those bound to Service for a Term of Years, and excluding Indians not taxed, three fifths of all other Persons."}
]}


//MONGO FUNCTIONS
function getQAs(callback) {
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		collection.find({}).toArray(function(err,docs){
			if(err)
				console.log(err);
			callback(docs);
		});
		db.close();
	});
}

function getActiveQA(callback) {
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		collection.find({"active":"true"}).toArray(function(err,activeQA){
			console.log(activeQA)
			//if this is the first time, or nothing comes back for some reason, use default dataset to get things started.
			if(activeQA.length == 0)
			{
				callback(query)
			}
			else
			{
				if(activeQA.length == 1)
					callback(activeQA[0]);
				else {
					getQAs(function(allQAs){
						console.log(allQAs)
						setActiveQA(allQAs[allQAs.length - 1]._id,function(){
							callback(allQAs[allQAs.length - 1]);
						});
					});
				}
			}
		});
		db.close();
	});
}

function setActiveQA(id,callback) {
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		collection.updateMany({},{"$set": {"active":"false"}},function(err,results){
			collection.update({"_id" :  new ObjectID(id)},{"$set": {"active":"true"}},function(err,results){
					callback();
			});
		});
	});
}

function getQA(q,callback) { //q is a valid document object to filter by....like {"question":"xxxx"}
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		collection.find(q).toArray(function(err,docs){
			if(err)
				console.log(err);
			callback(docs);
		});
		db.close();
	});
}

function exportQA(id,callback) { 
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		collection.find({"_id" :  new ObjectID(id)}).toArray(function(err,docs){
			if(err)
				console.log(err);
			//console.log(JSON.stringify(docs))
			var csv = "Question: " + docs[0].question + ",Date Submitted: " + docs[0].date + "\n\nAnswer:,Time Stamp:\n"
			for(x in docs[0].thoughts)
			{
				//JSON.stringify(docs[x])
				csv += docs[0].thoughts[x]['message'] + ',' + docs[0].thoughts[x]['timeStamp'] + "\n"
			}
			callback(csv);
		});
		db.close();
	});
}

function newQuestion(q,callback) { //q is a valid document object to insert into collection
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		collection.insertOne(q,function(err,docs){
			if(err)
			{
				console.log(err);
				callback(false);
			}
			else
			{
				callback(q);
			}
		});
		db.close();
	});
}

function editQuestion(id,setObj,callback) { //use id of response plus object of new properties to update
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		var success = true
		collection.updateOne({"_id" : new ObjectID(id)},{"$set":setObj},function(err,results){
			if(err)
			{
				console.log(err);
				success = false;
			}
			callback(success, results);
		});
		db.close();
	});
}

function deleteQA(id,callback) {
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		var success = true
		collection.remove({"_id":new ObjectID(id)},function(err,results){
			if(err)
			{
				console.log(err);
				success = false;
			}
			callback(results);
		});
		db.close();
	});
}

function newAnswer(q,a,ts,id,callback) { //q is the querying/find object to select the question. a is the new answer to insert in list. ts is timestamp, id is new ObjectID() called.
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		var success = true
		collection.update(q,{"$addToSet":{"thoughts" : {"message" : a ,"timeStamp" : ts, "_id" : id}}},function(err,docs){
			if(err)
			{
				console.log(err);
				success = false;
			}
			callback(success);
		});
		db.close();
	});
}

function editAnswer(id,message,callback) { //use id of response plus new message
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		var success = true
		collection.updateOne({"thoughts._id" : new ObjectID(id)},{"$set":{"thoughts.$.message":message}},function(err,results){
			if(err)
			{
				console.log(err);
				success = false;
			}
			callback(results);
		});
		db.close();
	});
}
function answerSuppression(id,state,callback) { //use id of response, true/false boolean for suppression. Default is nonexistent, therefore not suppressed.
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		var success = true
console.log(id)
console.log(state)
		collection.update({"thoughts._id" : new ObjectID(id)},{$set:{"thoughts.$.suppressed":state}},function(err,results){
			if(err)
			{
				console.log(err);
				success = false;
			}
			callback(results);
		});
		db.close();
	});
}

function deleteAnswer(id,callback) { //use id of response plus new message
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		var success = true
		collection.updateMany({},{"$pull":{"thoughts":{"_id":new ObjectID(id)}}},function(err,results){
			if(err)
			{
				console.log(err);
				success = false;
			}
			callback(results);
		});
		db.close();
	});
}

//drawing functions for displays screens.
function getCoordVect(thought)
{
	thought.x = (Math.random() * 100)
	thought.y = (Math.random() * 100)
	thought.vector.x = Math.random() * 10
	thought.vector.y = Math.random() * 10
	if(Math.random() < .5)
	{
		thought.vector.x = thought.vector.x * -1
	}
	if(Math.random() < .5)
	{
		thought.vector.y = thought.vector.y * -1
	}
	return thought;
}

function animateUpdate() {
	for(var x=0;x<query.thoughts.length;x++)
	{
		if(query.thoughts[x].highlighted == "true")
		{
			continue;
		}
		//console.log(query.thoughts[x].vector.x)
		//first see if thought is drifting out of bounds on X axis. If so, reverse
		if((query.thoughts[x].x < X_MIN_BOUNDS && query.thoughts[x].vector.x < 0) || (query.thoughts[x].x > X_MAX_BOUNDS && query.thoughts[x].vector.x > 0))
		{
			query.thoughts[x].vector.x = query.thoughts[x].vector.x * -1;
			query.thoughts[x].x = query.thoughts[x].x + query.thoughts[x].vector.x ;
		}
		else
		{
			//else, get some entropy. if negative as a result of an offset, reverse direction. Otherwise continue in same direction.
			var entropyX = Math.random() - .1;
			if(entropyX < 0)
			{
				query.thoughts[x].x = query.thoughts[x].x + (query.thoughts[x].vector.x * entropyX)
			}
			else
			{
				query.thoughts[x].x = query.thoughts[x].x + (query.thoughts[x].vector.x)
			}
		}
		
		//now check Y axis bounds.
		if((query.thoughts[x].y < Y_MIN_BOUNDS && query.thoughts[x].vector.y < 0) || (query.thoughts[x].y > Y_MAX_BOUNDS && query.thoughts[x].vector.y > 0))
		{
			query.thoughts[x].vector.y = query.thoughts[x].vector.y * -1;
			query.thoughts[x].y = query.thoughts[x].y + query.thoughts[x].vector.y;
		}
		else
		{
			var entropyY = Math.random() - .1;
			if(entropyY < 0)
			{
				query.thoughts[x].y = query.thoughts[x].y + (query.thoughts[x].vector.y * entropyY *.5)
			}
			else
			{
				query.thoughts[x].y = query.thoughts[x].y + (query.thoughts[x].vector.y * .5)
			}
		}
	}
	io.emit('animateUpdate',JSON.stringify(query))
	
}

function minimizeThoughts(callback) {
	for(x in query.thoughts)
	{
		if(query.thoughts[x].highlighted == "true")
		{
			io.emit("minimizeThought",query.thoughts[x]._id)
			query.thoughts[x].highlighted = "false";
		}
	}
	callback();
}


//on start, get on Mongo DB and get latest questions/answers, create local object with location and animation vector data as well as question/answer data

function setupQuestionAnswers(QA) {
getActiveQA(function(QA){
	console.log("Using question id " + QA._id + ". Question: " + QA.question)
	query = {"question":QA.question,"image":QA.image,"_id":QA._id,"thoughts":[],"suppressed":[]};
	for(x in QA.thoughts)
	{
		if(QA.thoughts[x].suppressed)
		{
			query.suppressed.push(getCoordVect({vector:{},_id:QA.thoughts[x]._id,message:QA.thoughts[x].message}))	
		}
		else
		{
			query.thoughts.push(getCoordVect({vector:{},_id:QA.thoughts[x]._id,message:QA.thoughts[x].message}))
		}
	}
	io.emit('data',JSON.stringify(query))
});
}
setupQuestionAnswers();
setInterval(function(){animateUpdate()},5000);



//Express.js routing starts here

//First protect /admin and the admin functions with basic authentication. Because this is all intended to be on a local LAN that should be secured,
//HTTPS is a lot of unneccessary overhead. IF this is going on the wide interwebs, you really should to change all of this!
//Basic auth prevents someone who manages to actually get to the admin panel on a kiosk from actually doing anything.
app.all("/admin/*",function(req,res,next){
	
	//Thanks to user "qwerty" on stackoverflow for a basic and compact auth comparison algorithm solution
	
	var auth = {login:process.env.THOUGHT_ADMIN_USER,password:process.env.THOUGHT_ADMIN_PASS}
	var b64auth = (req.headers.authorization || '').split(' ')[1] || '';
	var login = new Buffer(b64auth, "base64").toString().split(':')[0];
	var password = new Buffer(b64auth, "base64").toString().split(':')[1];
	
	if(!login || ! password || login !== auth.login || password !== auth.password)
	{
		res.set('WWW-Authenticate','Basic realm="thoughtAdmin"');
		res.status(401).send("User/Pass pls!");
		console.log("Failed admin logon request")
		return
	}
	console.log("accepted logon from " + req.ip)
	next();
	})

app.get('/app', function(req, res){
	res.sendFile(__dirname + '/thoughtboard_client.html');
});
app.get('/kiosk', function(req, res){
	res.sendFile(__dirname + '/kiosk.html');
});

app.get('/data', function(req,res){
	getActiveQA(function(q){res.json(JSON.stringify(q))})
});

app.get('/suppress/:id', function(req,res){
	answerSuppression(req.params.id,true,function(q){res.json(JSON.stringify(q))})
	setupQuestionAnswers();
});

app.get('/admin/unsuppress/:id', function(req,res){
	answerSuppression(req.params.id,false,function(q){res.json(JSON.stringify(q))})
	setupQuestionAnswers();
});

app.get('/admin/data', function(req, res){
	getQAs(function(docs){
		res.json(docs)
	});
});
app.post('/admin/question/add', uploads.single('image'),function(req,res){
			var now = new Date();
			newQuestion({"question":req.body.question,"date":now,"image":req.file,"active":"false"},function(success){
				if(success)
				{
					getQA(success,function(docs){
						res.json(docs[0])
					});
				}
			});
		});
app.post('/admin/question/edit/:id', uploads.single('image'),function(req,res){
			var now = new Date();
			var updateObj = {}
			if(req.file)
			{
				updateObj.image = req.file;
			}
			if(req.body.question)
			{
				updateObj.question = req.body.question;
			}
			if(req.body.bgcolor)
			{
				updateObj.bgcolor = req.body.bgcolor;
			}
			//res.json(updateObj);
			editQuestion(req.params.id,updateObj,function(success,results){
				res.json({"_id":req.params.id})
			});
		});

//all the admin functions are GET requests under the /admin parent.
app.get('/admin/answer/:name', function(req, res){
	switch(req.params.name) {
		case 'edit':
			console.log(req.query);
			editAnswer(req.query.id,req.query.message,function(results){
					res.send(results);
					setupQuestionAnswers();
			})
		break;
		case 'delete':
			console.log(req.query);
			deleteAnswer(req.query.id,function(results){
					res.send(results);
					setupQuestionAnswers();
			})
		break;
	}
});
app.get('/admin/question/:name',function(req, res){
	switch(req.params.name) {
		case 'delete':
			console.log("DELETE " + req.query.id);
			deleteQA(req.query.id,function(results){
					res.send(results);
					console.log(results)
					console.log('DELETED.')
			})
		break;
		case 'activate':
			console.log("ACTIVATE " + req.query.id);
			setActiveQA(req.query.id,function(results){
					res.send(results);
					console.log('ACTIVATED.')
					setupQuestionAnswers();
			})
		break;
		case 'export.csv':
			console.log("EXPORTING " + req.query.id);
			exportQA(req.query.id,function(results){
					res.type('text/csv')
					res.send(results);
					console.log('EXPORTED.')
			})
		break;
	}
});

//admin panel html page.
app.get('/admin', function(req, res){
	res.sendFile(__dirname + '/thoughtboard_admin.html');
});

//serve static files like jquery, manifest.json, twemoji, etc.
app.use(express.static(__dirname));


io.on('connection', function(socket){
	io.emit('data',JSON.stringify(query))
	socket.on('submit', function(submission){
		var thought = getCoordVect({vector:{},_id:new ObjectID(),message:submission.message})
		//override random start assingment and put in center of screen for viewability by user.
		//still maintain the X and Y axis float vectors
		thought.x = 50;
		thought.y = 50;
		console.log(thought)
		newAnswer({"_id":query._id},submission.message,new Date(),thought._id,function(){
			query.thoughts.push(thought);
			io.emit('newThought',JSON.stringify(thought))
		});
	});
	socket.on('highlight', function(submission){
		minimizeThoughts(function(){
			for(x in query.thoughts)
			{
				if(query.thoughts[x]._id == submission.id)
				{
					io.emit("maximizeThought",submission.id)
					query.thoughts[x].highlighted = "true";
					setTimeout(function(){
						for(x in query.thoughts)
						{
						if(query.thoughts[x]._id == submission.id && query.thoughts[x].highlighted == "true")
						{
							minimizeThoughts(function(){})
						}
						}
					},callout_timeout)
				}
			}	
		});
	});
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});
