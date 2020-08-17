const express = require('express');
const Business = require('../models/Business');
const Place = require('../models/Place');
const User = require('../models/User');
const {
	handleValidateId,
	handleRecordExists,
	handleValidateOwnership,
} = require('../middleware/custom_errors');
const { requireToken } = require('../middleware/auth');
const router = express.Router();

// INDEX
// GET api/businesses
router.get('/', (req, res, next) => {
	// Use our business model to find all of the documents
	// in the businesses collection
	// Then send all of the businesses back as json
	Business.find()
		.populate('owner', 'email -_id')
		.populate('places', 'location -_id')
		.then((businesses) => res.json(businesses));
});

// SHOW
// GET api/businesses/5a7db6c74d55bc51bdf39793
router.get('/:id', handleValidateId, (req, res, next) => {
	Business.findById(req.params.id)
		.populate('owner', 'email -_id')
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
				.populate('business', 'title -_id')
				.then((placesList) => res.json(placesList));
		})
		.catch((error) => console.log(error));
});

// PATCH to add a place to business
// router.patch(
// 	'/:id/addToOne',
// 	handleValidateId,
// 	requireToken,
// 	(req, res, next) => {
// 		Business.findByIdAndUpdate(req.params.id, { $addToSet: req.body })
// 			.then((business) => handleValidateOwnership(req, business))
// 			.then((business) => res.json(business))
// 			.catch(next);
// 	}
// );

router.patch(
	'/:id/overwriteOne',
	handleValidateId,
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

// CREATE
// POST api/businesses
router.post('/', requireToken, (req, res, next) => {
	const newBusiness = req.body;
	const userId = req.user._id;

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
});

// UPDATE
// PUT api/businesses/5a7db6c74d55bc51bdf39793
router.put('/:id', handleValidateId, requireToken, (req, res, next) => {
	Business.findById(req.params.id)
		.then(handleRecordExists)
		.then((business) => handleValidateOwnership(req, business))
		.then((business) => business.set(req.body).save())
		.then((business) => {
			res.json(business);
		})
		.catch(next);
});

// DESTROY
// DELETE api/businesses/5a7db6c74d55bc51bdf39793
router.delete('/:id', handleValidateId, requireToken, (req, res, next) => {
	Business.findById(req.params.id)
		.then(handleRecordExists)
		.then((business) => handleValidateOwnership(req, business))
		.then((business) => business.remove())
		.then(() => {
			res.sendStatus(204);
		})
		.catch(next);
});

module.exports = router;