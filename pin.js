var exec = require('child_process').exec;
var playing = false;
setInterval(function(){
	exec('gpio read 0',function(err,stdout,stderr){
		if(stdout[0] == '1' && playing == false)
		{
			console.log("could start film!")
		}
	});
},100);
