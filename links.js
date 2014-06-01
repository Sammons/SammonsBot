var mongoose = require('mongoose');

Schema = mongoose.Schema;
var linkSchema = new Schema({
	  link: {type: String, required: true}
	, postedBy: {type: Array}
	, date: {type: Date}
});

module.exports = mongoose.model('links',linkSchema);