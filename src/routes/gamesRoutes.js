const express = require("express");
const router = express.Router();
const { addGame, getGames, getGamesByCategory, getAllGames } = require("../controllers/gamesController");


router.route("/")
    .get(getGames)
    .post(addGame)

router.route("/:id")
    .get(getGamesByCategory)



module.exports = router;