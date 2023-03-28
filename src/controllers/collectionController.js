const asyncHandler = require("express-async-handler");
const Collection = require("../model/collectionModel");



module.exports = {
    getCollections: asyncHandler(async (req, res) => {
            const collections = await Collection.find({})
            if (!collections || collections.length === 0) return res.status(500).send({ statusCode: 500, message: "No se encontraron colecciones."});
            return res.send(collections);
    }),
    createCollection: asyncHandler(async (req, res) => {
        const collection = new Collection(req.body)
        if (!collection) return res.status(500).send({ message: "Ha ocurrido un error o se han ingresado mal los campos."});
        await collection.save();
        res.send({
            statusText: "Se ha creado exitosamente la colección",
            data: collection
        });
    }),
    createCategory: asyncHandler(async (req, res) => {
        console.log("hola");
    }),
}