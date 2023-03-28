const asyncHandler = require("express-async-handler");
const Link = require("../model/scrapModel");
const { Cluster } = require("puppeteer-cluster");
const Games = require("../model/gamesModel");

module.exports = {
    addLink: asyncHandler(async (req, res) => {
        const verify = await Link.find({ link: req.params.link });
        console.log(verify);
        if (verify.length > 0) return res.status(409).json({ status: 409, message: "El link ingresado ya se encuentra en la BDD" });
        const { link:scrapLink } = req.body;
        const link = new Link(req.body);
        if (!link) return res.status(500).send({ message: 'Ha ocurrido un error o se han ingresado mal los campos.'});
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
            timeout: 400000,
          });
          
        
          await Promise.all([
            cluster.execute(async ({ page }) => {
              console.log('Procesando tarea 1');
              const gamesList = await Link.find({});
              const validateList = await Games.find({});
              for(const game of gamesList) {
                let validate = validateList.find(x => x.url === game.link);
                const gameLink = game.link;
                const category = game.category;
                console.log(validate);
                if (!validate) {
                  console.log("Proceso de creacion")
                  await page.goto(gameLink);
                  await page.waitForNetworkIdle();
                  const data = await page.evaluate((category) => {
                    return {
                        title: document.querySelector('.underlined.pb-10.mb-20').textContent.trim(),
                        sku: document.querySelector('.btn.btn.btn-buy.btn-block.btn-cart.st-btn-buy').getAttribute('data-id'),
                        price: document.querySelector('.price-new').textContent.replace(/\,|\$|\CLP|/g, '').trim(),
                        image: document.querySelector('img:nth-child(2)').getAttribute('src'),
                        description: document.querySelector('#description').textContent.trim(),
                        discount: document.querySelector('#descuento-tag').textContent || "0%",
                        provider: new URL(window.location.href).hostname || "Sin proveedor",
                        url: window.location.href,
                        category,
                    }
                  }, [category])
                  let gameInfo = new Games(data)
                  await gameInfo.save();
                } else {
                  console.log("Proceso de actualizacion")
                  await page.goto(gameLink);
                  await page.waitForNetworkIdle();
                  const price = await page.$eval(".price-new", (el) => el.textContent.replace(/\,|\$|\CLP|/g, '').trim())
                  const updateGame = await Games.findOne({ url: gameLink });
                    updateGame.title = updateGame.title;
                    updateGame.sku = updateGame.sku;
                    updateGame.price = price || updateGame.price;
                    updateGame.image = updateGame.image;
                    updateGame.description = updateGame.description;
                    updateGame.discount = updateGame.discount;
                    updateGame.provider = updateGame.provider;
                    updateGame.category = updateGame.category;
                    await updateGame.save();
                }
                
                
              }
              
            }, { page: 1, priority: 1, taskId: 1 }),
        





            // cluster.execute(async ({ page }) => {
            //   console.log('Processing task 2');
            //   await page.goto('https://facebook.com/');
              
            // }, { page: 2, priority: 2, taskId: 2 })

          ]);
        
          await cluster.idle();
          await cluster.close();
          return res.send("Procesos terminados!")
    }),
    
}