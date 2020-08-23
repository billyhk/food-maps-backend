const express = require('express');
const Business = require('../models/Business');
const Place = require('../models/Place');
const User = require('../models/User');
const { ROLE } = require('../models/userRoles');
// const businessPrivileges = ROLE.ADMIN || ROLE.BASIC;

const {
	handleValidateId,
	handleRecordExists,
	handleValidateOwnership,
	handleValidateAuthRole,
	handleValidateBusinessAuthRole,
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
		.populate('owner', '_id')
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
				.populate('business', '-_id')
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
	Business.findById(req.params.id)
		.then(handleRecordExists)
		// .then((business) => handleValidateOwnership(req, business))
		// ***** on 94, put a conditional for business/admin roles, and nest another for ownership *****
		.then((business) => business.set(req.body).save())
		.then((business) => {
			res.json(business);
		})
		.catch(next);
});

// the below match might not be used as it was built mainly for keywords which will end up having its own schema with a N:N relationship with businesses
// PATCH to add to a properties value as array (only if item doesn't already exist)
// router.patch(
// 	'/:id/addToOne',
// 	handleValidateId,
// 	requireToken,
// 	(req, res, next) => {
// 		Business.findByIdAndUpdate(req.params.id, { $set: req.body }) // or $addToSet: ...
// 			.then((business) => handleValidateOwnership(req, business))
// 			.then((business) => res.json(business))
// 			.catch(next);
// 	}
// );

router.patch(
	'/:id/overwriteOne', //this will probably just end up being...
		 // /:id
	handleValidateId,
	// handleValidateAuthRole(ROLE.ADMIN || ROLE.BUSINESS),
	requireToken,
	(req, res, next) => {
		Business.findByIdAndUpdate(req.params.id)
			.then(handleRecordExists)
			.then((business) => handleValidateOwnership(req, business))
			.then((business) => business.set(req.body).save())
			.then((business) => {
				res.json(business);
			})
			.catch(next);
	}
);

////////////////////
///// DELETE //////
//////////////////

// DESTROY
// DELETE api/businesses/5a7db6c74d55bc51bdf39793
router.delete('/:id', handleValidateId, requireToken, (req, res, next) => {
	const businessId = req.params.id;
	const role = req.user.role;

	Business.findById(businessId)
		.then((business) => {
			handleValidateAuthRole(ROLE.BUSINESS || ROLE.ADMIN);

			// handleValidateOwnership(req, business);
		})
		.then(() => res.sendStatus(204))
		.catch((error) => console.log(error));
});

module.exports = router;
