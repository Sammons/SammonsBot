var mongoose = require('mongoose');

Schema = mongoose.Schema;
var phraseSchema = new Schema({
	  phrase: {type: String, required: true}
	, users: {type: Array}
	, count: {type: Number}
	, firstMention: {type: Date}
	, lastMention: {type: Date}
});

module.exports = mongoose.model('phrases',phraseSchema);