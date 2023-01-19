const express = require('express');
const router = express.Router();
const versioningController = require('../../controllers/versioningController')
const { verifyJWT } = require("../../middleware/verifyJWT")

router.route('/create')
    .put(verifyJWT, versioningController.createVersion)

router.route('/edit')
    .put(verifyJWT, versioningController.editVersion)

router.route('/delete')
    .put(verifyJWT, versioningController.deleteVersion)

router.route('/reorder')
    .put(verifyJWT, versioningController.reorderDocumentationsContent)

router.route('/section')
    .put(verifyJWT, versioningController.addSection)

router.route('/section/delete')
    .put(verifyJWT, versioningController.deleteSection)

router.route('/chapter')
    .put(verifyJWT, versioningController.addChapter)

router.route('/chapter/delete')
    .put(verifyJWT, versioningController.deleteChapter)

module.exports = router;