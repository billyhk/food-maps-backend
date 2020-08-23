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
		.populate('owner', 'username -_id')
		.populate('places', 'location -_id')
		.then((businesses) => res.json(businesses));
});

// SHOW
// GET business by id
// api/businesses/5a7db6c74d55bc51bdf39793
router.get('/:id', handleValidateId, (req, res, next) => {
	Business.findById(req.params.id)
		.populate('owner', '-id._id')
		.populate('places', 'location -_id')
		// .populate('places', '-_id')
		.then(handleRecordExists)
		.then((business) => {
			res.json(business);
		})
		.catch(next);
});

//GET places by business
router.get('/:id/places', handleValidateId, (req, res) => {
	Business.findOne({ id: req.params._id })
		.then((business) => {
			Place.find({ _id: { $in: business.places } })
				.populate('business', '-id._id')
				.then((placesList) => res.json(placesList));
		})
		.catch((error) => console.log(error));
});

//////////////////
///// POST //////
////////////////

// CREATE
// POST api/businesses
router.post('/', requireToken, (req, res, next) => {
	const newBusiness = req.body;
	const userId = req.user._id;
	if (req.user.role === (ROLE.BUSINESS || ROLE.ADMIN)) {
		User.findById(userId)
			.then((user) => {
				Business.create(newBusiness).then((business) => {
					user.businesses.push(business);
					user.save();
					business.save();
					res.json(business);
				});
			})
			.catch(next);
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
					currentUserId.toString() == businessOwnerId.toString()
				) {
					business.set(req.body).save();
					res.json(business);
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
					currentUserId.toString() == businessOwnerId.toString()
				) {
					business.set(req.body).save();
					res.json(business);
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

// the below match might not be used as it was built mainly for keywords which will end up having its own schema with a N:N relationship with businesses
// PATCH to add to a properties value as array (only if item doesn't already exist)
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
						currentUserId.toString() == businessOwnerId.toString()
					) {
						Business.findByIdAndUpdate(req.params.id, {
							$addToSet: { keywords: req.body.keywords },
						})
							.then((business) => res.json(business))
							.catch((error) => console.log(error));
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
					currentUserId.toString() == businessOwnerId.toString()
				) {
					Business.findByIdAndDelete(req.params.id)
						.then((business) => res.json(`Business Deleted: ${business.title}`))
						.catch((error) => console.log(error));
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
