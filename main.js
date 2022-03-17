const puppeteer = require('puppeteer');
const ObjectsToCsv = require('objects-to-csv')
const cliProgress = require('cli-progress');
const path = require('path');
const number = 50

const minimal_args = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
];

const mails = []
const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
console.log("Collecting clubs urls")
bar1.start(number-1, 0);
const getData = async () => {
  // 1 - Créer une instance de navigateur

  const LinkArray = []
  const browser = await puppeteer.launch({ignoreHTTPSErrors: true ,headless: true, args:minimal_args })
  const page = await browser.newPage()
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {request.abort()}
    else request.continue();
  });

  // 2 - Naviguer jusqu'à l'URL cible
  await page.goto('https://www.ffr.fr/trouver-un-club-de-rugby/resultats-de-recherche/')
    for(let i = 0; i < number; i++){
        bar1.update(i);
        let indexPage = 1;
        if(i < 4){
            indexPage = i+3;
        }else {
            indexPage = 6
        }
        const links = await page.evaluate(() => 
            // let's just get all links and create an array from the resulting NodeList
            Array.from(document.querySelectorAll("#root > div.result-club > div > div > div.col.col-md-7.col-lg-5.result-club__list > a")).map(anchor => [anchor.href, anchor.textContent])
            );
            for(const arrays of links){
                LinkArray.push(arrays[0])
            }
        await page.waitForSelector('#root > div > div > div > div.col.col-md-7.col-lg-5.result-club__list > ul > li:nth-child('+indexPage+') > a')
        await page.focus('#root > div > div > div > div.col.col-md-7.col-lg-5.result-club__list > ul > li:nth-child('+indexPage+') > a' )
        //console.log('//')
        //console.log(indexPage,i)
        //console.log('//')
        await page.keyboard.type('\n');
    }
    bar1.stop()
  // on ouvre chaqun des liens et on y récupère les emails:

  console.log("Collecting each club email")
  const bar2 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar2.start(LinkArray.length, 0);
  let i = 1;
  for(const clublink in LinkArray){
    bar2.update(i);
    i++;
    const page2 = await browser.newPage();        // open new tab
    await page2.goto(LinkArray[clublink]);       // go to
    await page2.bringToFront();     
    try {
        await page2.waitForSelector('#root > div:nth-child(2) > div > div.col.col-md-8.col-lg-9.bg-overflow > section > div > div > div.contact.mb-6.mb-md-7 > div.box > ul > li:nth-child(2) > p:nth-child(3) > a',{ timeout: 500 });
        const mail = await page2.$$eval('#root > div:nth-child(2) > div > div.col.col-md-8.col-lg-9.bg-overflow > section > div > div > div.contact.mb-6.mb-md-7 > div.box > ul > li:nth-child(2) > p:nth-child(3) > a', anchors => [].map.call(anchors, a => a.href));
        tmp = mail[0].substring(7,mail[0].length)
      } catch (error) {
        try {await page2.waitForSelector('#root > div:nth-child(2) > div > div.col.col-md-8.col-lg-9.bg-overflow > section > div > div > div.contact.mb-6.mb-md-7 > div.box > ul > li:nth-child(1) > p:nth-child(3) > a',{timeout: 500})
        const mail = await page2.$$eval('#root > div:nth-child(2) > div > div.col.col-md-8.col-lg-9.bg-overflow > section > div > div > div.contact.mb-6.mb-md-7 > div.box > ul > li:nth-child(1) > p:nth-child(3) > a', anchors => [].map.call(anchors, a => a.href));
        tmp = mail[0].substring(7,mail[0].length)}
        catch (error) {}
      }
    await page2.close();
    await page.bringToFront();
    if(tmp.includes("@")){
      mails.push({data : tmp})
    }
  }
  bar2.stop()
    
    


  console.log("\n generating the csv result")
  const csv = new ObjectsToCsv(mails);
     

  await csv.toDisk('./test.csv');
  console.log("csv have been saved to " + path.join(__dirname) + "/test.csv")
    
   
  browser.close()
}

// Appelle la fonction getData() et affichage les données retournées
getData()










