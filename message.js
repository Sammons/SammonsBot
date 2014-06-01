var mongoose = require('mongoose');

Schema = mongoose.Schema;
var messageSchema = new Schema({
	  from: {type: String, required: true}
	, to: {type: String}
	, message: {type: String}
	, date: {type: Date, default: Date.now}
});

module.exports = mongoose.model('messages',messageSchema);