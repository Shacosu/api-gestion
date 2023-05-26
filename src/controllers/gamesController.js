const asyncHandler = require("express-async-handler");
const Games = require("../model/gamesModel");
const Link = require("../model/scrapModel");


module.exports = {
    getGames: asyncHandler(async (req, res) => {
        const games = await Games.find().populate('category');
        if (!games || games.length === 0) return res.status(500).send({ statusCode: 500, message: "No se encontraron juegos disponibles." });
        return res.send(games);
    }),
    addGame: asyncHandler(async (req, res) => {
        const game = new Games(req.body)
        if (!game) return res.status(500).send({ message: "Ha ocurrido un error o se han ingresado mal los campos." });
        await game.save();
        res.send({
            statusText: "Se ha añadido exitosamente el juego.",
            data: game
        });
    }),
    getGamesByCategory: asyncHandler(async (req, res) => {
        const id = req.params.id;
        const games = await Games.find().where("category").equals(id);
        if (!games) return res.status(500).send({ message: "No se encontró ningún juego vinculado a esta categoría." });
        res.json(games)
    }),
    removeGameById: asyncHandler(async (req, res) => {
        const url = req.body.url;
        if (!url) return res.status(500).send({ message: "Ha ocurrido un error o se han ingresado mal los campos." });
        const game = await Games.findOne({ "url": {$regex: url } });
        const link = await Link.findOne({ "link": {$regex: url } });
        if (link && game) {
            await Games.deleteOne({ "url": {$regex: url } });
            await Link.deleteOne({ "link": {$regex: url } });
            return res.json(game);
        } else if (link && !game) {
            await Games.deleteOne({ "url": {$regex: url } });
            return res.json(game);
        } else {
            return res.status(500).send({ message: "No se encontró ningún juego." });  
        }
        
    })
}