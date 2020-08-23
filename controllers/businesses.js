const express = require('express');
const Business = require('../models/Business');
const Place = require('../models/Place');
const User = require('../models/User');
const { ROLE } = require('../models/userRoles');
// const businessPrivileges = ROLE.ADMIN || ROLE.BASIC;

const {
	// handleValidateOwnership,
	// handleValidateAuthRole,
	// handleValidateBusinessAuthRole,
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
// GET api/businesses
router.get('/', (req, res, next) => {
	Business.find()
		.populate('owner', '-id._id')
		.populate('places', 'location -_id')
		.then((businesses) => res.json(businesses));
});

// SHOW
// GET business by id
// api/businesses/5a7db6c74d55bc51bdf39793
router.get('/:id', handleValidateId, (req, res) => {
	Business.findById(req.params.id)
		.populate('owner', '-id._id')
		.populate('places', 'location -_id')
		// .populate('places', '-_id')
		.then(handleRecordExists)
		.then((business) => {
			res.json(business);
		})
		.catch((error) => res.json(error));
});

//GET places by business
router.get('/:id/places', handleValidateId, (req, res) => {
	Business.findOne({ id: req.params._id })
		.then((business) => {
			Place.find({ _id: { $in: business.places } })
				.populate('business', '-id._id')
				.then((placesList) => res.json(placesList));
		})
		.catch((error) => res.json(error));
});

////////////////////
///// CREATE //////
//////////////////

// POST api/businesses
router.post('/', requireToken, (req, res, next) => {
	const newBusiness = req.body;
	const currentRole = req.user.role;
	const userId = req.user._id;

	if (currentRole === ROLE.ADMIN || currentRole === ROLE.BUSINESS) {
		User.findById(userId).then((user) => {
			if (userId.toString() === req.body.owner || currentRole === ROLE.ADMIN) {
				Business.create(newBusiness)
					.then((business) => {
						user.businesses.push(business);

						user.save();
						business.save();

						res.json(business);
					})
					.catch((error) => res.json(error));
			} else {
				res.json(new OwnershipError());
				throw new OwnershipError();
			}
		});
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

////////////////////
///// UPDATE //////
//////////////////

// PUT api/businesses/5a7db6c74d55bc51bdf39793
router.put('/:id', handleValidateId, requireToken, (req, res, next) => {
	const currentRole = req.user.role;
	const currentUserId = req.user._id;

	if (currentRole === ROLE.ADMIN || currentRole === ROLE.BUSINESS) {
		Business.findById(req.params.id)
			.then(handleRecordExists)
			.then((business) => {
				const businessOwnerId = business.owner._id;
				if (
					currentRole === ROLE.ADMIN ||
					currentUserId.toString() === businessOwnerId.toString()
				) {
					business.set(req.body).save();
					res.json(business);
				} else {
					res.json(new OwnershipError());
					throw new OwnershipError();
				}
			})
			.catch((error) => res.json(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

router.patch('/:id', handleValidateId, requireToken, (req, res, next) => {
	const currentRole = req.user.role;
	const currentUserId = req.user._id;

	if (currentRole === ROLE.ADMIN || currentRole === ROLE.BUSINESS) {
		Business.findById(req.params.id)
			.then(handleRecordExists)
			.then((business) => {
				const businessOwnerId = business.owner._id;
				if (
					currentRole === ROLE.ADMIN ||
					currentUserId.toString() === businessOwnerId.toString()
				) {
					business.set(req.body).save();
					res.json(business);
				} else {
					res.json(new OwnershipError());
					throw new OwnershipError();
				}
			})
			.catch((error) => res.json(error));
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

// PATCH to add to a values to keywords array (only if item doesn't already exist)
// the below match might not be used as if keywords gets its own schema with a N:N relationship with businesses
router.patch(
	'/:id/keywords',
	handleValidateId,
	requireToken,
	(req, res, next) => {
		const currentRole = req.user.role;
		const currentUserId = req.user._id;

		if (currentRole === ROLE.ADMIN || currentRole === ROLE.BUSINESS) {
			Business.findById(req.params.id)
				.then(handleRecordExists)
				.then((business) => {
					const businessOwnerId = business.owner._id;
					if (
						currentRole === ROLE.ADMIN ||
						currentUserId.toString() === businessOwnerId.toString()
					) {
						Business.findByIdAndUpdate(req.params.id, {
							$addToSet: { keywords: req.body.keywords },
						})
							.then((business) => res.json(business))
							.catch((error) => res.json(error));
					} else {
						res.json(new OwnershipError());
						throw new OwnershipError();
					}
				});
		} else {
			res.json(new RoleUnauthorizedError());
			throw new RoleUnauthorizedError();
		}
	}
);

// PATCH to remove a keyword from the keywords array
router.patch(
	'/:id/keywords',
	handleValidateId,
	requireToken,
	(req, res, next) => {
		const currentRole = req.user.role;
		const currentUserId = req.user._id;

		if (currentRole === ROLE.ADMIN || currentRole === ROLE.BUSINESS) {
			Business.findById(req.params.id)
				.then(handleRecordExists)
				.then((business) => {
					const businessOwnerId = business.owner._id;
					if (
						currentRole === ROLE.ADMIN ||
						currentUserId.toString() === businessOwnerId.toString()
					) {
						Business.findByIdAndUpdate(req.params.id, {
							$pull: { keywords: [req.body.keywords] },
						})
							.then((business) => res.json(business))
							.catch((error) => res.json(error));
					} else {
						res.json(new OwnershipError());
						throw new OwnershipError();
					}
				});
		} else {
			res.json(new RoleUnauthorizedError());
			throw new RoleUnauthorizedError();
		}
	}
);

////////////////////
///// DELETE //////
//////////////////

// DESTROY
// DELETE api/businesses/5a7db6c74d55bc51bdf39793
router.delete('/:id', handleValidateId, requireToken, (req, res, next) => {
	const currentRole = req.user.role;
	const currentUserId = req.user._id;

	if (currentRole === ROLE.ADMIN || currentRole === ROLE.BUSINESS) {
		Business.findById(req.params.id)
			.then(handleRecordExists)
			.then((business) => {
				const businessOwnerId = business.owner._id;
				if (
					currentRole === ROLE.ADMIN ||
					currentUserId.toString() === businessOwnerId.toString()
				) {
					Business.findByIdAndDelete(req.params.id)
						.then((business) => res.json(`Business Deleted: ${business.title}`))
						.catch((error) => res.json(error));
				} else {
					res.json(new OwnershipError());
					throw new OwnershipError();
				}
			});
	} else {
		res.json(new RoleUnauthorizedError());
		throw new RoleUnauthorizedError();
	}
});

module.exports = router;
