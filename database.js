var mongoose = require('mongoose');

mongoose.connect(process.env.BUTTER);
	var dbConnection = mongoose.connection;
	dbConnection.on('error',function(e) {console.log(e);});
	dbConnection.once('open',function() {
		console.log('connected to database');
	});
var db = {};
db.connection = mongoose.connection;
db.message = require('./message.js');
db.phrase = require('./phrase.js');
db.friend = require('./friends.js');
db.link = require('./links.js');
db.person = require('./people.js')

process.env.BUTTER = null;

db.addLink = function(from, to, link) {
	var newlink = new db.link();
	newlink.link = link;
	newlink.postedBy = from;
	newlink.save();
}

db.addFriendIfNew = function(name, cb) {
	db.friend.findOne({name: name}, function(err, doc) {
		if (err) return console.log(err);
		if (doc) {if (cb) cb(false); return false;}
		var newFriend = new db.friend();
		newFriend.name = name;
		newFriend.save();
		if (cb) cb(true)
	})
}
db.addPersonIfNew = function(name, cb) {
	db.person.findOne({name: name}, function(err, doc) {
		if (err) return console.log(err);
		if (doc) {if (cb) cb(false); return false;}
		var newP = new db.person();
		newP.name = name;
		newP.save();
		if (cb) cb(true)
	})
}
db.addMessage = function(from, to, message, cb) {
	var newMsg = new db.message();
	newMsg.from = from;
	newMsg.to = to;
	newMsg.message = message;
	newMsg.save();
	if (cb) return cb(newMsg);
	return newMsg
}
db.noticePhrase = function(from, to, message,cb) {
	db.phrase.findOne({phrase: message.trim()},function(err, doc) {
		var returnable = {};
		if (err) return console.log(err);
		if (!doc) {
			var new_phrase = new db.phrase();
			new_phrase.phrase = message;
			new_phrase.users = [];
			new_phrase.users.push(from);
			new_phrase.count = 1;
			new_phrase.firstMention = Date.now();
			new_phrase.save();
			returnable.brand_new = true;
			returnable.doc = new_phrase;
		} else {
			doc.count++;
			doc.lastMention = Date.now();
			if (doc.users.indexOf(from) < 0) {
				returnable.first_for_you = true;
				doc.users.push(from);
			}
			doc.save();
			returnable.doc = doc;
		}
		if (cb) cb(returnable.doc);
		return returnable;
	});
}
module.exports = db;