const express = require('express');
const { requireToken } = require('../middleware/auth');
const router = express.Router();
const Place = require('../models/Place');

const {
	handleRecordExists,
	handleValidateOwnership,
} = require('../middleware/custom_errors');


//GET all places
router.get('/', requireToken, (req, res) => {
	Place.find()
		.populate('business', 'title -_id')
		.then((places) => res.json(places))
		.catch((error) => console.log(error));
});

//POST to create new place
router.post('/', requireToken, (req, res) => {
	const newPlace = req.body;
	Place.create(newPlace)
		.then((place) => {
			res.json(place);
		})
		.catch((error) => console.log(error));
});

//DELETE place
router.delete('/:id', requireToken, (req, res) => {
	Place.findOneAndDelete({ id: req.params._id })
		.then(handleRecordExists)
		.then((place) => res.json())
		.catch((error) => console.log(error));
});

module.exports = router;
