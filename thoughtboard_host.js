var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var query = {question:"What does the Constitution Say?",thoughts:[
{x:5,y:75,vector:{x:1,y:7.1},height:"10%",width:"10%",message:"We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America."},
{x:50,y:7,vector:{x:3,y:2.1},height:"10%",width:"15%",message:"Section 1: All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives."},
{x:25,y:45,vector:{x:-7.6,y:5},height:"10%",width:"10%",message:"Section 2: The House of Representatives shall be composed of Members chosen every second Year by the People of the several States, and the Electors in each State shall have the Qualifications requisite for Electors of the most numerous Branch of the State Legislature."},
{x:5,y:95,vector:{x:4.2,y:-3.8},height:"5%",width:"10%",message:"No Person shall be a Representative who shall not have attained to the Age of twenty five Years, and been seven Years a Citizen of the United States, and who shall not, when elected, be an Inhabitant of that State in which he shall be chosen"},
{x:5,y:75,vector:{x:6.81,y:-7.1},height:"10%",width:"20%",message:"Representatives and direct Taxes shall be apportioned among the several States which may be included within this Union, according to their respective Numbers, which shall be determined by adding to the whole Number of free Persons, including those bound to Service for a Term of Years, and excluding Indians not taxed, three fifths of all other Persons."}
]}


function animateUpdate() {
	for(var x=0;x<query.thoughts.length;x++)
	{
		var entropyX = Math.random() - .1
		var entropyY = Math.random() - .1
		if(entropyX < 0)
			query.thoughts[x].x = query.thoughts[x].x + (query.thoughts[x].vector.x * entropyX)
		else
			query.thoughts[x].x = query.thoughts[x].x + (query.thoughts[x].vector.x)
		
		if(entropyY < 0)
			query.thoughts[x].y = query.thoughts[x].y + (query.thoughts[x].vector.y * entropyY *.25)
		else
			query.thoughts[x].y = query.thoughts[x].y + (query.thoughts[x].vector.y * .25)
			
		if(query.thoughts[x].x < -25 || query.thoughts[x].x > 125)
			query.thoughts[x].vector.x = query.thoughts[x].vector.x * -1;
		if(query.thoughts[x].y < -15 || query.thoughts[x].y > 115)
			query.thoughts[x].vector.y = query.thoughts[x].vector.y * -1;
	}
	io.emit('animateUpdate',JSON.stringify(query))
	
}

setInterval(function(){animateUpdate()},5000);

app.get('/app', function(req, res){
  res.sendFile(__dirname + '/thoughtboard_client.html');
});
/*
app.get('/socket.io.js', function(req, res){
  res.sendfile(__dirname + 'socket.io.js');
});*/

io.on('connection', function(socket){
	io.emit('data',JSON.stringify(query))
	socket.on('submit', function(submission){
		var thought = {vector:{},message:submission.message}
		thought.x = (Math.random() * 100)
		thought.y = (Math.random() * 100)
		thought.vector.x = Math.random()
		thought.vector.y = Math.random()
		if(Math.random() < .5)
		{
			thought.vector.x = thought.vector.x * -1
		}
		if(Math.random() < .5)
		{
			thought.vector.y = thought.vector.y * -1
		}
		console.log(thought)
		query.thoughts.push(thought);
		io.emit('newThought',JSON.stringify(thought))
	});
});

http.listen(8000, function(){
  console.log('listening on *:8000');
});
