const express = require('express');
const { requireToken } = require('../middleware/auth');
const router = express.Router();
const Place = require('../models/Place');
const Business = require('../models/Business');
const { ROLE } = require('../models/userRoles');

const {
	handleRecordExists,
	handleValidateOwnership,
	handleValidateId,
	handleValidateAuthRole,
} = require('../middleware/custom_errors');
const { json } = require('express');

//////////////////
///// GET ///////
////////////////

//GET all places
router.get('/', (req, res) => {
	Place.find()
		.populate('business', '-id._id')
		.populate('owner', '-id._id')
		.then((places) => res.json(places))
		.catch((error) => res.json(error));
});

//GET places by id
router.get('/:id', (req, res) => {
	Place.findById(req.params.id)
		.populate('business', '-id._id')
		.populate('owner', '-id._id')
		.then((places) => res.json(places))
		.catch((error) => res.json(error));
});

////////////////////
///// CREATE //////
//////////////////

//POST to create new place
router.post('/', requireToken, (req, res, next) => {
	const newPlace = req.body;
	const businessId = req.body.business;
	const currentUserId = req.user._id;
	const currentRole = req.user.role;

	if (currentRole === ROLE.ADMIN || currentRole === ROLE.BUSINESS) {
		Business.findById(businessId).then((business) => {
			if (
				currentUserId.toString() === req.body.owner ||
				currentRole === ROLE.ADMIN
			) {
				Place.create(newPlace)
					.then((place) => {
						business.places.push(place);

						business.save();
						place.save();

						res.json(place);
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
///// DELETE //////
//////////////////

//DELETE place
router.delete('/:id', handleValidateId, requireToken, (req, res, next) => {
	const currentRole = req.user.role;
	const currentUserId = req.user._id;

	if (currentRole === ROLE.ADMIN || currentRole === ROLE.BUSINESS) {
		Place.findById(req.params.id)
			.then(handleRecordExists)
			.then((place) => {
				const placeOwnerId = place.owner._id;
				if (
					currentRole === ROLE.ADMIN ||
					currentUserId.toString() === placeOwnerId.toString()
				) {
					Place.findByIdAndDelete(req.params.id)
						.then((place) => res.json(`Place Deleted: ${place.location}`))
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
