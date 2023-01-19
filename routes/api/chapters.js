const express = require('express');
const router = express.Router();
const chaptersController = require('../../controllers/chaptersController')
const { verifyJWT } = require("../../middleware/verifyJWT")

router.route('/')
    .get(chaptersController.getAllChapters)
    .post(verifyJWT, chaptersController.createNewChapter)
    .put(verifyJWT, chaptersController.updateChapter)
    .delete(verifyJWT, chaptersController.deleteChapter);

router.route('/:id')
    .get(chaptersController.getChaptersById);

module.exports = router;