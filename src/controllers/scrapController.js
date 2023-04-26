const asyncHandler = require("express-async-handler");

const Link = require("../model/scrapModel");
const Games = require("../model/gamesModel");

const axios = require("axios");
const cheerio = require("cheerio");

const { Cluster } = require("puppeteer-cluster");

require("colors")

module.exports = {
  addLink: asyncHandler(async (req, res) => {
    const verify = await Link.find({ link: req.params.link });
    if (verify.length > 0) return res.status(409).json({ status: 409, message: "El link ingresado ya se encuentra en la BDD" });
    const { link: scrapLink } = req.body;
    const link = new Link(req.body);
    if (!link) return res.status(500).send({ message: 'Ha ocurrido un error o se han ingresado mal los campos.' });
    await link.save();
    res.send({
      statusText: 'Se ha añadido exitosamente el Link.',
      data: link
    });
  }),
  scrapGames: asyncHandler(async (req, res) => {
    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 5,
      puppeteerOptions: {
        headless: true,
      },
      timeout: 7000000,
    });


    await Promise.all([

      cluster.queue(async ({ page }) => {
        console.log('Trabajando con juegosdigitaleschile.com'.red);
        const gamesList = await Link.find({ "link": { $regex: "juegosdigitaleschile.com" } });
        const validateList = await Games.find({});
        for (const game of gamesList) {
          const gameLink = game.link;
          const validate = validateList.find(x => x.url === game.link);
          console.log("Link:", gameLink)
          const category = game.category;
          if (!validate) {
            const response = await axios.get(gameLink);
            const $ = cheerio.load(response.data);
            const data = {
              title: $('.underlined.pb-10.mb-20').text().trim(),
              sku: $('.btn.btn.btn-buy.btn-block.btn-cart.st-btn-buy').getAttribute('data-id'),
              price: $('.price-new').text().replace(/\,|\$|\CLP|/g, '').trim(),
              image: $('img:nth-child(2)').attr('src'),
              description: $('#description').text().trim(),
              discount: $('#descuento-tag').text() || "0%",
              provider: new URL(window.location.href).hostname || "Sin proveedor",
              url: window.location.href,
              category,
            }
            let gameInfo = new Games(data)
            await gameInfo.save();
          } else {
            const response = await axios.get(gameLink);
            const $ = cheerio.load(response.data);
            const price = $('#final_price > .price-new').text().replace(/\,|\$|\CLP|/g, '').trim();
            try {
              await Games.findOneAndUpdate({ url: gameLink }, { price: Number(price) });
            } catch (error) {
              console.log(error)
            }
          }


        }

      }, { page: 1, priority: 1, taskId: 1 }),


      cluster.queue(async ({ page }) => {
        console.log('Trabajando con chilejuegosdigitales.com'.blue);
        const gamesList = await Link.find({ "link": { $regex: "chilejuegosdigitales.cl" } });
        const validateList = await Games.find({ "provider": { $regex: "chilejuegosdigitales.cl" } });
        for (const game of gamesList) {
          const { link, category } = game;
          console.log("Link:", link)
          const response = await axios.get(link);
          const $ = cheerio.load(response.data);
          const gameInfo = {
            title: $("#ProductSection > div.grid > div.grid-item.large--three-fifths > h1").text().trim(),
            price: Number($('#productPrice-product-template > span.visually-hidden').text().replace(/\,|\$|\CLP|\./g, '').trim()),
            image: `https://chilejuegosdigitales.cl/${$(".product-photo-container > img").attr('src')}`,
            description: $('.product-description').text().trim(),
            provider: new URL(link).hostname || "Sin proveedor",
            discount: $("#descuento-tag").text() || "0%",
            url: link,
            category
          }
          const validate = validateList.some(x => x.url === link);
          if (validate) {
            try {
              const price = $('#productPrice-product-template > span.visually-hidden').text().replace(/\,|\$|\CLP|\./g, '').trim();
              const updateGame = await Games.findOneAndUpdate({ url: link }, { price: Number(price) });
            } catch (error) {
              console.log(error)
            }
          } else {
            const savedGame = new Games(gameInfo);
            await savedGame.save();
          }

        }
      }, { page: 2, priority: 2, taskId: 2 }) // cambiar a 2

    ]);

    await cluster.idle();
    await cluster.close();
    return res.send("Procesos terminados!")
  }),

}