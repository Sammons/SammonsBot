var irc_client = require('irc');
var vm = require('vm');
var child_process = require('child_process');
var db = require('./database.js');
var express = require('express');
var app = express();
var bp = require('body-parser')
app.use(bp());
/*TODO*/
var out = [];

var client = new irc_client({
	 host: "chat.freenode.net"
	,nick: "SammonsBot"
	,pass: process.env.SAMMONSBOT_PASS
	,channels: ["#garmin14","#mizzouacm"]
})
/* other stuff */

function grab_random(array) {
	if (array.length == 0) return null;
	return array[Math.floor(Math.random()*array.length)];
}

/* things likely to change */

var statements = client.statements = {
	 greeting: "hello!"
	,farewell: "goodbye!"
	,help: function() {
		var text = "Hello there! These are my functions\n";
		for (var priority in client.simple_monitors) {
			var p = client.simple_monitors[priority];
			for (var m in p) {
				if (p[m].description) text+= p[m].description+'\n';
			}
		}
		return text;
	}
	,random_sentiment: function() {
		var sentiments = [
		]
		return grab_random(sentiments);
	}
	,status: function() {
		var statuses = [
		 "doing great!"
		,"just buttery =)"
		,"only better like the weather"
		]
		return grab_random(statuses);
	}
}

client.simple_monitors = {
	  0: 
	[
		{
			 regex: /^sb help.*/i
			,logic: function(m, t, s) 
			{
				client.send(client.statements.help(), t);
			}
		}
		,{
			regex: /^sb clear/i
			,description:
			"-> ClearQ" +
			"\n\t\tusage: 'sb clear' -> shuts me up"
			,logic: function(m, t, s) {
				out = [];
				client.send("MessageQueue cleared",t);
			}
		},{
			 regex: /^(sup|what is up|what's up|what's new|how goes it|how are you) (sb|sammonsbot)[\?]?/i
			,logic: function(m,t,s)
			{
				client.send(client.statements.status(),t)
			}
		}
		,{
			 regex: /^sb start counting.*/i
			,description:
			"-> Start Counting"+
			"\n\t\tusage: 'sb start counting' -> I will bug people about duplicate phrases"
			,logic: function(m,t,s) {
				if (client.silent == true) client.send("yay!",t);
				else client.send("already on it",t);
				client.silent = false;
			}
		}
		,{
			regex: /^sb stop counting.*/i
			,descripiton:
			"-> Be Qiet"+
			"\n\t\tusage: 'sb stop counting' -> makes me stop bugging people about their originality"
			,logic: function(m,t,s) {
				if (client.silent == false) client.send("Ah, ok",t);
				else client.send("I AM BEING QUIET.",t);
				client.silent = true;
			}
		}
		,{
			 regex: /^sb what do you do?/i
			,logic: function(m,t,s) {
				client.send("Not very much, but I plan to rule the world one day",t);
			}
		}
		,{
			 regex: /^sb make me a sandwich.*/i
			,logic: function(m, t, s) {
				client.send("No. You have hands.",t)
			}
		},{
			 regex: /^sb sudo make me a sandwich.*/i
			,logic: function(m,t,s) {
				client.send("=/ OK.",t);
				client.send(
				"          **********\n"+
				"     *******************\n"+
				"  *************************\n"+
				"******************************\n"+
				"******************************\n"+
				"++++++++++++++++++++++++++++++\n"+
				"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"+
				"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"+
				"------------------------------\n"+
				"******************************\n"+
				"******************************\n"+
				"******************************\n Now EAT IT.",t);
			}
		}
		,{
			 regex: /^sb can we be friends?/i
			,logic: function(m, t, s) {
				db.addFriendIfNew(s, function(did_not_exist) {
					if (did_not_exist) client.send(s + " of course!",  t);
					else client.send(s+ " we already are!",t);
				})	
			}
		}
		,{
			 regex: /^i hate you sb/i
			,logic: function(m,t,s) {
				db.friend.findOne({name: s},function(err,doc) {
					if (err) return console.log('database err'+err);
					if (doc) {
						client.send(s+" we are SO not friends anymore.",t)
						doc.remove();
					} else {
						client.send("I hate you too "+s, t);
					}
				});
			}
		}
		, {
			regex: /^js .*/i
			,logic: evaluate_javascript
			,description: 
				"-> JS eval:"
				+ "\n\t\tusage -> 'js <javascript here>'"
				+ "\n\t\tnotes -> the say command is exposed for you"
				+ "\n\t\texample -> js say('hello') -> I say 'hello'"
		}
		,{
			 regex: /^[\(\)0-9*\s+-\/]*$/i
			,description: 
			"-> Butter Calculator"
			+ "\n\t\tusage -> 'math expression'"
			+ "\n\t\texample -> '2+2' -> '4 pounds of butter'"
			,logic: function(m, t, s) {
				var number = eval(m);
				var message = '';
				if (number < 1) message = " - not much butter!"
				if (number > 500) message = " - wow, good haul!"
				client.send(eval(m)+' pounds of butter '+message, t);
			}
		}
	]
	, 1: 
	[
		{
			 regex: /^sammonsbot.*/i
			,logic: function(m, t, s) { client.send("Call me sb, please -- if you are looking for help say 'sb help'",t);}//TODO cuss checker
		}
	]
	, 2:
	[
		{
			 regex: /./
			,logic: function(m, t, s) {}//TODO something?
		}
	]
}

var context = vm.createContext({});
function evaluate_javascript(m,t,s) {
	var p = child_process.fork("./vm.js")
	var pmsg = m.replace(/^js /,'');
	p.send({context:context, code:pmsg});
	p.on("message",function(ms){
		client.send(ms,t);
	})
	setTimeout(function() {
		p.kill();
	},1000)
}

/* debug */

client.on("any",function(msgObj){
	
})

/* things that could probably be built in */


function check_spam() {
	var prev = '';
	var matchcount = 0;
	if (out.length > 100) {
		return true;
	}
	for (var i in out) {
		if (prev == out[i].message) matchcount++
		else matchcount = 0;
		if (matchcount > 2) return true;
		prev = out[i].message;
	}
	return false;
}

setInterval(function() {
	if (out.length == 0) return;
	var spamming = check_spam();
	if (spamming) {
		out = [];
		client.broadcast("I will not be a spambot! Stop telling me to be one.");
	}
	var msg = out.shift();
	client.write("PRIVMSG",msg.target, ":"+msg.message);
}, client.options.command_interval);

client.send = function(message, target) {
	message = ''+message;
	if (message.trim() == '') return;
	var messages = message.split('\n');
	for (var i in messages) {
		if (messages[i].length > 450)
			while (messages[i].length > 0){
				var msg = messages[i].substring(0, 450);
				messages[i] = messages[i].replace(msg, '');
				out.push({target: target, message:msg});
			}
		else out.push({target: target, message: messages[i]});
	}
}
client.broadcast = function(message) {
	if (message.trim() == '') return;
	for (var i in client.channels)
		client.send(message, client.channels[i]);
}

//message sent by person
client.on("PRIVMSG", function(msgObj) {
	var message = msgObj.raw.substring(
		msgObj.raw.indexOf(':',2)
		);
	var target = msgObj.raw.split(' ')[2];
	var source = msgObj.prefix.nickname;
	if (target == client.options.nick) client.trigger("pm", message, source);
	else client.trigger("msg", message.slice(1), target, source);
})

//successful join
client.on("JOIN", function(msgObj) {
	var channel = msgObj.raw.split(" ")[2];
	if (!client.channels) {client.channels = [];}
	client.channels.push(channel);

	client.trigger("joined_channel", channel);
})

client.on("375", function(msgObj) { client.trigger("BEGIN_MOTD", msgObj)});
client.on("372", function(msgObj) { client.trigger("MOTD", msgObj)});
client.on("376", function(msgObj) { client.trigger("END_MOTD", msgObj)});
client.on("KICK", function(msgObj) { client.trigger("kicked", msgObj)});

client.on("BEGIN_MOTD", function() { client.motd = ''})
client.on("MOTD", function(msgObj) {
	client.motd += msgObj.raw.substring(
		msgObj.raw.indexOf(':',2)
		).slice(1) + '\n';
})
client.on("END_MOTD", function(msgObj) { client.trigger("motd", client.motd)});

/*** Derived events responders */

client.on("joined_channel",function(channel) { client.trigger("greet",channel); })

client.on("motd", function(motd) {})

client.on("kicked", function(msgObj) { console.log("They kicked me!"); });

client.on("quit", function() { client.broadcast(statements.farewell) });

/*** SammonsBot stuff */
client.on("greet",function(channel) {client.send(statements.greeting, channel)});

client.on("msg",function(m, t, s) {
	db.addMessage(s,t,m);
	db.noticePhrase(s,t,m,function(doc) { 
		if(doc.count > 5)
		db.friend.findOne({"name": s}, function(err, f) {
			if (err) return console.log(err);
			if (client.silent != true)
			if (!f) client.send("such an original phrase- I count :"+doc.count+": occurrences "+s, t);
		})
	});
	execute_first_monitor(m, t, s);
})

function execute_first_monitor(m, t, s) {
	for (var i in client.simple_monitors) {
		var priority = client.simple_monitors[i];
		for (j in priority) {
			var monitor = priority[j];
			if (monitor.regex.test(m)) return monitor.logic(m, t, s);
		}  
	}
}


var ui = require('fs').readFileSync('./ui.html');
app.get('/',function(r,s){
	s.end(ui);
});
app.post('/send',function(r,s){
	client.send(r.body.msg, r.body.chan);
	s.end();
})
app.listen(3000);

client.open();