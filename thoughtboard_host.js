var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var DBurl = "mongodb://localhost:27017/thoughtboard";
var X_MIN_BOUNDS = 0;
var X_MAX_BOUNDS = 100;
var Y_MIN_BOUNDS = 5;
var Y_MAX_BOUNDS = 96;
var curQA = ''

var query = {question:"What does the Constitution Say?",thoughts:[
{x:5,y:75,vector:{x:1,y:7.1},height:"10%",width:"10%",message:"We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America."},
{x:50,y:7,vector:{x:3,y:2.1},height:"10%",width:"15%",message:"Section 1: All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives."},
{x:25,y:45,vector:{x:-7.6,y:5},height:"10%",width:"10%",message:"Section 2: The House of Representatives shall be composed of Members chosen every second Year by the People of the several States, and the Electors in each State shall have the Qualifications requisite for Electors of the most numerous Branch of the State Legislature."},
{x:5,y:95,vector:{x:4.2,y:-3.8},height:"5%",width:"10%",message:"No Person shall be a Representative who shall not have attained to the Age of twenty five Years, and been seven Years a Citizen of the United States, and who shall not, when elected, be an Inhabitant of that State in which he shall be chosen"},
{x:5,y:75,vector:{x:6.81,y:-7.1},height:"10%",width:"20%",message:"Representatives and direct Taxes shall be apportioned among the several States which may be included within this Union, according to their respective Numbers, which shall be determined by adding to the whole Number of free Persons, including those bound to Service for a Term of Years, and excluding Indians not taxed, three fifths of all other Persons."}
]}



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

function newAnswer(q,a,ts,callback) { //q is the querying/find object to select the question. a is the new answer to insert in list. ts is timestamp.
	MongoClient.connect(DBurl, function(err,db){
		var collection = db.collection("QAs");
		var success = true
		collection.update(q,{"$addToSet":{"thoughts" : {"message" : a ,"timeStamp" : ts, "_id" : new ObjectID()}}},function(err,docs){
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


//on start, get on Mongo DB and get latest questions/answers, create local object with location and animation vector data as well as question/answer data

function setupQuestionAnswers(QA) {
getActiveQA(function(QA){
	console.log("Using question id " + QA._id + ". Question: " + QA.question)
	query = {"question":QA.question,"_id":QA._id,"thoughts":[]};
	for(x in QA.thoughts)
	{
		query.thoughts.push(getCoordVect({vector:{},message:QA.thoughts[x].message}))
	}
	io.emit('data',JSON.stringify(query))
});
}
setupQuestionAnswers();
setInterval(function(){animateUpdate()},5000);

app.get('/app', function(req, res){
	res.sendFile(__dirname + '/thoughtboard_client.html');
});

app.get('/admin/:name', function(req, res){
	switch(req.params.name) {
		case 'data':
			getQAs(function(docs){
				res.json(docs)
			});
			break;
		case 'add':
			var now = new Date();
			newQuestion({"question":req.query.q,"date":now,"active":"false"},function(success){
				if(success)
				{
					getQA(success,function(docs){
						res.json(docs[0])
					});
				}
			});
			break;
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
		case 'activate':
			console.log(req.query);
			setActiveQA(req.query.id,function(results){
					res.send(results);
					setupQuestionAnswers();
			})
			break;
	}
});

app.get('/admin', function(req, res){
	res.sendFile(__dirname + '/thoughtboard_admin.html');
});

app.use(express.static(__dirname));

io.on('connection', function(socket){
	io.emit('data',JSON.stringify(query))
	socket.on('submit', function(submission){
		var thought = getCoordVect({vector:{},message:submission.message})
		//override random start assingment and put in center of screen for viewability by user.
		//still maintain the X and Y axis float vectors
		thought.x = 50;
		thought.y = 50;
		console.log(thought)
		newAnswer({"_id":query._id},submission.message,new Date(),function(){
			query.thoughts.push(thought);
			io.emit('newThought',JSON.stringify(thought))
		});
	});
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});
