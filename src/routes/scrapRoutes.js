const express = require("express");
const router = express.Router();
const { addLink, scrapGames } = require("../controllers/scrapController");


router.route("/add-link")
    .post(addLink)

router.route('/').get(scrapGames)


module.exports = router;