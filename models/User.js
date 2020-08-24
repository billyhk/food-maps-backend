const mongoose = require('../db/connection');
const { ROLE } = require('./userRoles');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			// required: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: Object.values(ROLE),
			default: 'basic',
			required: true,
		},
		businesses: [
			{
				ref: 'Business',
				type: mongoose.Schema.Types.ObjectId,
			},
		],
		favorites: [
			{
				ref: 'Business',
				type: mongoose.Schema.Types.ObjectId,
			},
		],
		requests: [
			{
				ref: 'Request',
				type: mongoose.Schema.Types.ObjectId,
			},
		],
	},
	{
		id: false,
		timestamps: true,
		toJSON: {
			virtuals: true,
			// ret is the returned Mongoose document
			transform: (_doc, ret) => {
				delete ret.password;
				return ret;
			},
		},
	}
);

module.exports = mongoose.model('User', userSchema);
