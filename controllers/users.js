const express = require('express');
const bcrypt = require('bcrypt');
const { createUserToken } = require('../middleware/auth');
const User = require('../models/User');
const Business = require('../models/Business')
// const {
// 	handleValidateId,
// 	handleRecordExists,
// 	handleValidateOwnership,
// } = require('../middleware/custom_errors');
const { requireToken } = require('../middleware/auth');

const router = express.Router();

// routes/controllers here

module.exports = router;

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
			role: req.body.role
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
		// Pass the user and the request to createUserToken
		.then((user) => createUserToken(req, user))
		// createUserToken will either throw an error that
		// will be caught by our error handler or send back
		// a token that we'll in turn send to the client.
		.then((token) => res.json({ token }))
		.catch(next);
});

//route to get all users
router.get('/', requireToken, (req, res) => {
	User.find()
		.then((users) => res.json(users))
		.catch((error) => console.log(error));
});

//route to get user by id
router.get('/:id', requireToken, (req, res) => {
	User.findOne({ id: req.params._id })
		.then((user) => res.json(user))
		.catch((error) => console.log(error));
});

//route to edit user information
router.put('/:id', requireToken, (req, res) => {
	User.findOneAndUpdate({ id: req.params._id }, req.body, {
		new: true,
	})
		.then((user) => res.json(user))
		.catch((error) => console.log(error));
});

//route to delete account by id
//find id and delete
router.delete('/:id', requireToken, (req, res) => {
	User.findOneAndDelete({ id: req.params._id })
		.then((user) => res.json(user))
		.catch((error) => console.log(error));
});

//route to get businesses by user
router.get('/:id/businesses', requireToken, (req, res) => {
	User.findOne({ id: req.params._id })
		.then((user) => {
				Business.find({ _id: { $in: user.businesses } })
				.then((businessesList) => res.json(businessesList))
		})
		.catch((error) => console.log(error));
})

module.exports = router;