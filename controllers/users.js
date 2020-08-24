const express = require('express');
const bcrypt = require('bcrypt');
const { createUserToken } = require('../middleware/auth');
const User = require('../models/User');
const Business = require('../models/Business');
const {
	// handleValidateId,
	// handleRecordExists,
	// handleUserOwnership,
	handleAuthenticateAdmin,
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

//////////////////
///// GET ///////
////////////////

//GET all users (ROLE.ADMIN only)
// api/users
router.get('/', requireToken, handleAuthenticateAdmin(), (req, res) => {
	User.find()
		.populate('businesses', '-id._id')
		.then((users) => res.json(users))
		.catch((error) => console.log(error));
});

//GET user by username
router.get('/:username', requireToken, (req, res, next) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		// console.log(req.user.username, req.user.role)
		User.findOne({ username: usernameQuery })
			.populate('businesses', '-id._id')
			.populate('favorites', '-id._id')
			.then((user) => res.json(user))
			.catch((error) => console.log(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

//GET user by id
router.get('/id/:id', requireToken, (req, res, next) => {
	const idQuery = req.params.id;

	// console.log(req.user._id, req.user.role)
	if (idQuery === req.user._id || req.user.role === ROLE.ADMIN) {
		// console.log(req.user.id, req.user.role)
		User.findById(idQuery)
			.populate('businesses', '-id._id')
			.then((user) => res.json(user))
			.catch((error) => console.log(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

//GET businesses by user
router.get('/:username/businesses', requireToken, (req, res) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		User.findOne({ username: req.params.username })
			.then((user) => {
				Business.find({
					_id: { $in: user.businesses },
				}).then((businessesList) => res.json(businessesList));
			})
			.catch((error) => console.log(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

////////////////////
///// UPDATE //////
//////////////////

//PUT to edit user information (all at once)
router.put('/:username', requireToken, (req, res) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		User.findOneAndUpdate({ username: usernameQuery }, req.body, {
			new: true,
		})
			.then((user) => res.json(user))
			.catch((error) => res.json(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

// to edit user information (one or more fields)
router.patch('/:username', requireToken, (req, res) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		User.findOneAndUpdate(
			{ username: usernameQuery },
			{
				$set: req.body,
			}
		)
			.then((user) => res.json(user))
			.catch((error) => res.json(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

//PATCH to edit user role
router.patch('/:username/role', requireToken, (req, res) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		User.findOneAndUpdate(
			{ username: usernameQuery },
			{
				$set: { role: req.body.role },
			}
		)
			.then((user) => res.json(user))
			.catch((error) => res.json(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

// PATCH to add to favorites
router.patch('/:username/favorites-add', requireToken, (req, res) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		User.findOneAndUpdate(
			{ username: usernameQuery },
			{
				$addToSet: { favorites: req.body.favorites },
			}
		)
			.then((user) => res.json(user))
			.catch((error) => res.json(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

// PATCH to remove from favorites
router.patch('/:username/favorites-remove', requireToken, (req, res) => {
	const usernameQuery = req.params.username;

	if (usernameQuery === req.user.username || req.user.role === ROLE.ADMIN) {
		User.findOneAndUpdate(
			{ username: usernameQuery },
			{
				$pull: { favorites: req.body.favorites },
			}
		)
			.then((user) => res.json(user))
			.catch((error) => res.json(error));
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
			.then(() => res.json(`User Deleted: ${usernameQuery}`))
			.catch((error) => res.json(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

module.exports = router;
