const express = require('express');
const router = express.Router();
const sectionsController = require('../../controllers/sectionsController')
const { verifyJWT } = require("../../middleware/verifyJWT")

router.route('/')
    .get(sectionsController.getAllSections)
    .post(verifyJWT, sectionsController.createNewSection)
    .put(verifyJWT, sectionsController.updateSection)
    .delete(verifyJWT, sectionsController.deleteSection);

router.route('/:id')
    .get(sectionsController.getSectionsById)

module.exports = router;