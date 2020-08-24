const express = require('express');
const User = require('../models/User');
const Request = require('../models/Request');
const { ROLE } = require('../models/userRoles');
const {
	handleValidateId,
	handleRecordExists,
	OwnershipError,
	RoleUnauthorizedError,
} = require('../middleware/custom_errors');
const { requireToken } = require('../middleware/auth');
const router = express.Router();

//////////////////
///// GET ///////
////////////////

// INDEX
// GET api/requests
router.get('/', (req, res, next) => {
	Request.find()
		.populate('owner', 'username -_id')
		.then((businesses) => res.json(businesses));
});

// SHOW
// GET request by id
// api/requests/5a7db6c74d55bc51bdf39793
router.get('/:id', handleValidateId, (req, res) => {
	Request.findById(req.params.id)
		.populate('owner', '-id._id')
		.then(handleRecordExists)
		.then((request) => {
			res.json(request);
		})
		.catch((error) => res.json(error));
});

////////////////////
///// CREATE //////
//////////////////

// POST api/requests
router.post('/', requireToken, (req, res, next) => {
	const newRequest = req.body;
	const currentRole = req.user.role;
	const userId = req.user._id;

	User.findById(userId)
		.then((user) => {
			if (userId.toString() === req.body.owner || currentRole === ROLE.ADMIN) {
				Request.create(newRequest)
					.then((request) => {
						user.requests.push(request);

						user.save();
						request.save();

						res.json(request);
					})
					.catch((error) => res.json(error));
			} else {
				res.json(new OwnershipError());
				throw new OwnershipError();
			}
		})
		.catch((error) => res.json(error));
});

////////////////////
///// UPDATE //////
//////////////////

// PUT api/requests/5a7db6c74d55bc51bdf39793
router.put('/:id', handleValidateId, requireToken, (req, res, next) => {
	const currentRole = req.user.role;
	const currentUserId = req.user._id;

	Request.findById(req.params.id)
		.then(handleRecordExists)
		.then((request) => {
			const requestOwnerId = request.owner._id;
			if (
				currentRole === ROLE.ADMIN ||
				currentUserId.toString() === requestOwnerId.toString()
			) {
				request.set(req.body).save();
				res.json(request);
			} else {
				res.json(new OwnershipError());
				throw new OwnershipError();
			}
		})
		.catch((error) => res.json(error));
});

// PATCH to edit any one field
router.patch('/:id', handleValidateId, requireToken, (req, res, next) => {
	const currentRole = req.user.role;
	const currentUserId = req.user._id;

	Request.findById(req.params.id)
		.then(handleRecordExists)
		.then((request) => {
			const requestOwnerId = request.owner._id;
			if (
				currentRole === ROLE.ADMIN ||
				currentUserId.toString() === requestOwnerId.toString()
			) {
				request.set(req.body).save();
				res.json(request);
			} else {
				res.json(new OwnershipError());
				throw new OwnershipError();
			}
		})
		.catch((error) => res.json(error));
});

// PATCH to add to keywords array
router.patch(
	'/:id/keywords-add',
	handleValidateId,
	requireToken,
	(req, res, next) => {
		const currentRole = req.user.role;
		const currentUserId = req.user._id;

		Request.findById(req.params.id)
			.then(handleRecordExists)
			.then((request) => {
				const requestOwnerId = request.owner._id;
				if (
					currentRole === ROLE.ADMIN ||
					currentUserId.toString() === requestOwnerId.toString()
				) {
					Request.findByIdAndUpdate(req.params.id, {
						$addToSet: { keywords: req.body.keywords },
					})
						.then((request) => res.json(request))
						.catch((error) => res.json(error));
				} else {
					res.json(new OwnershipError());
					throw new OwnershipError();
				}
			})
			.catch((error) => res.json(error));
	}
);

// PATCH to remove from keywords array
router.patch(
	'/:id/keywords-remove',
	handleValidateId,
	requireToken,
	(req, res, next) => {
		const currentRole = req.user.role;
		const currentUserId = req.user._id;

		Request.findById(req.params.id)
			.then(handleRecordExists)
			.then((request) => {
				const requestOwnerId = request.owner._id;
				if (
					currentRole === ROLE.ADMIN ||
					currentUserId.toString() === requestOwnerId.toString()
				) {
					Request.findByIdAndUpdate(req.params.id, {
						$pull: { keywords: { $in: req.body.keywords } },
					})
						.then((request) => res.json(request))
						.catch((error) => res.json(error));
				} else {
					res.json(new OwnershipError());
					throw new OwnershipError();
				}
			})
			.catch((error) => res.json(error));
	}
);

////////////////////
///// DELETE //////
//////////////////

// DESTROY
// DELETE request by id
router.delete('/:id', handleValidateId, requireToken, (req, res, next) => {
	const currentRole = req.user.role;
	const currentUserId = req.user._id;

	Request.findById(req.params.id)
		.then(handleRecordExists)
		.then((request) => {
			const requestOwnerId = request.owner._id;
			if (
				currentRole === ROLE.ADMIN ||
				currentUserId.toString() === requestOwnerId.toString()
			) {
				Request.findByIdAndDelete(req.params.id)
					.then((request) => res.json(`Request Deleted: ${request.title}`))
					.catch((error) => res.json(error));
			} else {
				res.json(new OwnershipError());
				throw new OwnershipError();
			}
		})
		.catch((error) => res.json(error));
});

module.exports = router;
