/// Require models
const User = require('../models/User');
const Business = require('../models/Business');
// Require the data
const seedData = require('./businessSeeds.json');

const getUser = async () => {
	try {
		if (!process.argv[2]) {
			throw new Error(
				'To seed the database provide an email address for an existing user'
			);
		}
		const user = await User.findOne({ email: process.argv[2] });
		if (!user) {
			throw new Error('No matching user found!');
		}
		return user;
	} catch (error) {
		console.error(error);
	}
};

// Delete any existing documents in the businesss collection
Business.deleteMany()
	.then(getUser)
	.then((user) => {
		const seedDataWithOwner = seedData.map((business) => {
			business.owner = user._id;
			return business;
		});
		return Business.insertMany(seedDataWithOwner);
	})
	.then(console.log)
	.then(console.error)
	.finally(() => {
		process.exit();
	});
