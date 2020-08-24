const mongoose = require('../db/connection');

const RequestSchema = new mongoose.Schema(
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
		keywords: [{ type: String }],
		places: [
			{
				location: {
					type: [Number],
					// required: true,
				},
			},
		],
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Request', RequestSchema);
