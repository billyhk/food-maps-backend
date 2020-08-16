const mongoose = require('../db/connection');

const BusinessSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: String,
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		places: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Place',
				// required: true,
			},
		],
		// img: {
		// 	type: String,
		// },
		// additionalImages: [
		// 	{
		// 		type: String,
		// 	},
		// ],
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Business', BusinessSchema);
