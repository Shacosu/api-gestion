const express = require("express");
const router = express.Router();
const { addGame, getGames, getGamesByCategory, getAllGames, removeGameById } = require("../controllers/gamesController");


router.route("/")
    .get(getGames)
    .post(addGame)

router.route("/:id")
    .get(getGamesByCategory)

router.route("/remove/:id")
    .delete(removeGameById)



module.exports = router;