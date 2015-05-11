let mongoose = require('mongoose')
require('songbird')

let postSchema = mongoose.Schema({
	userid: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	},
	image: {
		data: Buffer,
		contentType: String
	},
	createdDate: {
		type: Date,
		required: true
	},
	updatedDate: {
		type: Date,
		required: true
	}
})

module.exports = mongoose.model('Post', postSchema)
