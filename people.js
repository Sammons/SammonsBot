var mongoose = require('mongoose');

Schema = mongoose.Schema;
var peopleSchema = new Schema({
	  name: {type: String, required: true}
	, met: {type: Date}
});

module.exports = mongoose.model('people',peopleSchema);