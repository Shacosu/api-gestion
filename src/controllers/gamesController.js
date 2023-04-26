const asyncHandler = require("express-async-handler");
const Games = require("../model/gamesModel");


module.exports = {
    getGames: asyncHandler(async (req, res) => {
            const games = await Games.find().populate('category');       
            if (!games || games.length === 0) return res.status(500).send({ statusCode: 500, message: "No se encontraron juegos disponibles."});
            return res.send(games);
    }),
    addGame: asyncHandler(async (req, res) => {
        const game = new Games(req.body)
        if (!game) return res.status(500).send({ message: "Ha ocurrido un error o se han ingresado mal los campos."});
        await game.save();
        res.send({
            statusText: "Se ha añadido exitosamente el juego.",
            data: game
        });
    }),
    getGamesByCategory: asyncHandler(async (req, res) => {
        const id = req.params.id;
        const games = await Games.find().where("category").equals(id);
        if(!games) return res.status(500).send({ message: "No se encontró ningún juego vinculado a esta categoría."});
        res.json(games)
    }),
    // getAllGames: asyncHandler(async (req, res) => {
    //     const id = req.params.id;
        
    //     // if(!games) return res.status(500).send({ message: "No se encontró ningún juego."});
    //     res.json(games)
    // }),
}