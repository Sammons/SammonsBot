setInterval(function() {

},40);
var vm = require('vm')
process.on("message",function(m){
	var result = '';
	var script_result='';
	try{
	var script = vm.createScript(m.code);
	m.context.say = function(m){
		result += m+'\n';
	}
		script_result = script.runInNewContext(m.context)||'';
	}catch(e){result = e+'';}
	
	process.send((result.trim()+ '\n' + script_result.trim()).trim());
})