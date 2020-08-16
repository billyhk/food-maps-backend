const mongoose = require('../db/connection');

const PlaceSchema = new mongoose.Schema(
	{
		location: {
			type: [Number],
			required: true,
		},
		business: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Business',
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('Place', PlaceSchema);
