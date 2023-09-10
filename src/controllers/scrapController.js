const asyncHandler = require("express-async-handler");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const Link = require("../model/scrapModel");
const Games = require("../model/gamesModel");

const axios = require("axios");
const cheerio = require("cheerio");

const { Cluster } = require("puppeteer-cluster");

puppeteer.use(StealthPlugin());

require("colors")

module.exports = {
  addLink: asyncHandler(async (req, res) => {
    const link = new Link(req.body);
    const verify = await Link.find({ link: req.body.link });
    if (verify.length > 0) return res.status(409).json({ status: 409, message: "El link ingresado ya se encuentra en la BDD" });
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
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      puppeteer: puppeteer,
      timeout: 7000000,
    });


    await Promise.all([

      cluster.queue(async ({ page }) => {
        console.log('Trabajando con juegosdigitaleschile.com'.red);
        const gamesList = await Link.find({ "link": { $regex: "juegosdigitaleschile.com" } });
        const validateList = await Games.find();
        for (const game of gamesList) {
          const gameLink = game.link;
          console.log("Link:", gameLink)
          const category = game.category;
          let validate = validateList.some(x => x.url === gameLink)
          if (!validate) {
            try {
              const response = await axios.get(gameLink);
              const $ = cheerio.load(response.data);
              const data = {
                title: $('.underlined.pb-10.mb-20').text().trim(),
                sku: new Date(),
                price: $('#final_price > div.price-new').text().replace(/\,|\$|\CLP|/g, '').trim(),
                image: $('body > div:nth-child(11) > div:nth-child(1) > div:nth-child(1) > div.col-sm-12.col-xs-12.col-md-70.pb-20 > div > div > div.col-xs-12.col-sm-5 > div > img').attr('src'),
                description: $('#description').text().trim(),
                discount: $('#descuento-tag').text() || "0%",
                provider: new URL(gameLink).hostname || "Sin proveedor",
                url: gameLink,
                category,
              }
              let gameInfo = new Games(data)
              await gameInfo.save();
            } catch (error) {
              console.log(error.message)
            }
          } else {
            const response = await axios.get(gameLink);
            const $ = cheerio.load(response.data);
            const price = $('#final_price > div.price-new').text().replace(/\,|\$|\CLP|/g, '').trim();
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
            image: `https:${$(".product-photo-container > img").attr('src')}`,
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
      }, { page: 2, priority: 2, taskId: 2 }),

      cluster.queue(async ({ page }) => {
        console.log('Trabajando con eneba.com'.yellow);
        const gamesList = await Link.find({ "link": { $regex: "eneba.com" } });
        const validateList = await Games.find({ "provider": { $regex: "eneba.com" } });
        const { data } = await axios.get("https://mindicador.cl/api/euro", {
          timeout: 10000,
        });
        const euroActualPrice = Math.round(data.serie[0].valor) || 870;
        for (const gameItem of gamesList) {
          const { link: game, category } = gameItem;
          try {
            console.log("Link:", game)
            await page.goto(game, { waitUntil: 'networkidle2', timeout: 15000 });
            const html = await page.content();
            const $ = cheerio.load(html);
            const price = $('meta[property="product:price:amount"]').attr('content');
            const image = $('meta[property="og:image"]').attr('content');
            console.log("Imagen:", image)
            console.log("Precio:", price)
            const validate = validateList.some(x => x.url === game);
            if (!validate) {
              const gameInfo = {
                title: $("main > div > div> div> div > div > div > div > h1").text().trim(),
                price: (Number(price) * euroActualPrice).toFixed(0),
                image,
                description: $('#app > main > div > div > div > div > div > div:nth-child(10) > div').text().trim(),
                provider: new URL(game).hostname || "Sin proveedor",
                discount: $("#descuento-tag").text() || "0%",
                url: game,
                category
              }
              const savedGame = new Games(gameInfo);
              await savedGame.save();
            } else {
              await Games.findOneAndUpdate({ url: { $regex: game } }, { price: (Number(price) * euroActualPrice).toFixed(0) });
            }
          } catch (error) {
            console.log(error.message)
          }

        }
      }, { page: 3, priority: 3, taskId: 3 })

    ]);

    await cluster.idle();
    await cluster.close();
    return res.send("Procesos terminados!")
  }),

}