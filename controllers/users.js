const express = require('express');
const bcrypt = require('bcrypt');
const { createUserToken } = require('../middleware/auth');
const User = require('../models/User');
const Business = require('../models/Business');
const {
	handleValidateId,
	handleRecordExists,
	handleAuthenticateAdmin,
	handleUserOwnership,
	RoleUnauthorizedError,
} = require('../middleware/custom_errors');
const { ROLE } = require('../models/userRoles');
const { requireToken } = require('../middleware/auth');

const router = express.Router();

// routes/controllers here

module.exports = router;

///////////////////////////////
///// SIGN UP / SIGN IN //////
/////////////////////////////

// SIGN UP
// POST /api/signup
// Using async/await
// Add the async keyword
router.post('/signup', async (req, res, next) => {
	// wrap it in a try/catch to handle errors
	try {
		// store the results of any asynchronous calls in variables
		// and use the await keyword before them
		const password = await bcrypt.hash(req.body.password, 10);
		const user = await User.create({
			email: req.body.email,
			password,
			username: req.body.username,
			role: req.body.role,
		});
		res.status(201).json(user);
	} catch (error) {
		// return the next callback and pass it the error from catch
		return next(error);
	}
});

// SIGN IN
// POST /api/signin
router.post('/signin', (req, res, next) => {
	User.findOne({ username: req.body.username })
		.then((user) => createUserToken(req, user))
		.then((token) => res.json({ token }))
		.catch(next);
});

/////////////////
///// GET //////
///////////////

//GET all users (ROLE.ADMIN only)
router.get('/', requireToken, handleAuthenticateAdmin(), (req, res) => {
	User.find()
		.populate('businesses', 'title -_id')
		.then((users) => res.json(users))
		.catch((error) => console.log(error));
});

//GET user by username
router.get('/:username', requireToken, (req, res, next) => {
	const usernameQuery = req.params.username;

	User.findOne({ username: usernameQuery })
		.populate('businesses', '-_id')
		.then((user) => {
			if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
				return res.json(user);
			} else {
				res.json(new RoleUnauthorizedError());
				throw new RoleUnauthorizedError();
			}
		})
		.catch((error) => console.log(error));
});

//GET businesses by user
router.get('/:username/businesses', requireToken, (req, res) => {
	User.findOne({ username: req.params.username })
		.then((user) => {
			Business.find({
				_id: { $in: user.businesses },
			}).then((businessesList) => res.json(businessesList));
		})
		.catch((error) => console.log(error));
});

////////////////////
///// UPDATE //////
//////////////////

//route to edit user information
router.put('/:username', requireToken, (req, res) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		User.findOneAndUpdate({ username: usernameQuery }, req.body, {
			new: true,
		})
			.then((user) => {
				return res.json(user);
			})
			.catch((error) => console.log(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

////////////////////
///// DELETE //////
//////////////////

// DELETE by username
router.delete('/:username', requireToken, (req, res) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		User.findOneAndDelete({ username: usernameQuery })
			.then(() => {
				return res.json(`User Deleted: ${usernameQuery}`);
			})
			.catch((error) => console.log(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

module.exports = router;
