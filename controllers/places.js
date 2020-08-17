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

//GET all places
router.get('/', (req, res) => {
	Place.find()
		.populate('business', '_id')
		.then((places) => res.json(places))
		.catch((error) => console.log(error));
});

//POST to create new place
router.post(
	'/',
	requireToken,
	handleValidateAuthRole(ROLE.ADMIN || ROLE.BUSINESS),
	(req, res, next) => {
		const newPlace = req.body;
		const businessId = req.body.business;

		Business.findById(businessId)
			.then((business) => {
				Place.create(newPlace).then((place) => {
					business.places.push(place);
					business.save();
					place.save();
					res.json(place);
				});
			})
			.catch(next);
	}
);

//DELETE place
router.delete(
	'/:id',
	handleValidateId,
	handleValidateOwnership,
	handleValidateAuthRole(ROLE.ADMIN || ROLE.BUSINESS),
	requireToken,
	(req, res) => {
		const id = req.params.id;
		Place.findByIdAndRemove(id)
			.then(handleRecordExists)
			.then((place) => res.json(place))
			.catch((error) => console.log(error));
	}
);

module.exports = router;
