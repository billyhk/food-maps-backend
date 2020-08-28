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
		keywords: [{ type: String }],
		places: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Place',
				// required: true,
			},
		],
		hoursOfOperation: [
			{
				monday: {
					start: { type: String },
					end: { type: String },
				},
			},
			{
				tuesday: {
					start: { type: String },
					end: { type: String },
				},
			},
			{
				wednesday: {
					start: { type: String },
					end: { type: String },
				},
			},
			{
				thursday: {
					start: { type: String },
					end: { type: String },
				},
			},
			{
				friday: {
					start: { type: String },
					end: { type: String },
				},
			},
			{
				saturday: {
					start: { type: String },
					end: { type: String },
				},
			},
			{
				sunday: {
					start: { type: String },
					end: { type: String },
				},
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
