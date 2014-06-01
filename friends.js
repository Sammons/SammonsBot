var mongoose = require('mongoose');

Schema = mongoose.Schema;
var friendSchema = new Schema({
	  name: {type: String, required: true}
	, met: {type: Date}
});

module.exports = mongoose.model('friends',friendSchema);