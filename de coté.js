const puppeteer = require('puppeteer');
const ObjectsToCsv = require('objects-to-csv')



const mails = []

const getData = async () => {
  // 1 - Créer une instance de navigateur

  const LinkArray = []
  const browser = await puppeteer.launch({ignoreHTTPSErrors: true ,headless: true })
  const page = await browser.newPage()

  // 2 - Naviguer jusqu'à l'URL cible
  await page.goto('https://www.ffr.fr/trouver-un-club-de-rugby/resultats-de-recherche/')
    for(let i = 0; i < 20; i++){
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
                console.log(arrays[0])
                LinkArray.push(arrays[0])
            }
        await page.waitForSelector('#root > div > div > div > div.col.col-md-7.col-lg-5.result-club__list > ul > li:nth-child('+indexPage+') > a')
        await page.focus('#root > div > div > div > div.col.col-md-7.col-lg-5.result-club__list > ul > li:nth-child('+indexPage+') > a' )
        //console.log('//')
        //console.log(indexPage,i)
        //console.log('//')
        await page.keyboard.type('\n');
    }
    console.log(LinkArray.length)
  // on ouvre chaqun des liens et on y récupère les emails:

  for(const clublink in LinkArray){
    const page2 = await browser.newPage();        // open new tab
    await page2.goto(LinkArray[clublink]);       // go to
    await page2.bringToFront();     
    try {
        await page2.waitForSelector('#root > div:nth-child(2) > div > div.col.col-md-8.col-lg-9.bg-overflow > section > div > div > div.contact.mb-6.mb-md-7 > div.box > ul > li:nth-child(2) > p:nth-child(3) > a',{ timeout: 500 });
        const mail = await page2.$$eval('#root > div:nth-child(2) > div > div.col.col-md-8.col-lg-9.bg-overflow > section > div > div > div.contact.mb-6.mb-md-7 > div.box > ul > li:nth-child(2) > p:nth-child(3) > a', anchors => [].map.call(anchors, a => a.href));
        console.log('scapred ' ,LinkArray[clublink])
        mails.push({data : mail[0].substring(7,mail[0].length)})
      } catch (error) {
        console.log("The element didn't appear.",LinkArray[clublink],'try 2nd methode...')
        try {await page2.waitForSelector('#root > div:nth-child(2) > div > div.col.col-md-8.col-lg-9.bg-overflow > section > div > div > div.contact.mb-6.mb-md-7 > div.box > ul > li:nth-child(1) > p:nth-child(3) > a',{timeout: 500})
        const mail = await page2.$$eval('#root > div:nth-child(2) > div > div.col.col-md-8.col-lg-9.bg-overflow > section > div > div > div.contact.mb-6.mb-md-7 > div.box > ul > li:nth-child(1) > p:nth-child(3) > a', anchors => [].map.call(anchors, a => a.href));
        console.log('scapred with 2nd method')
        mails.push({data :mail[0].substring(7,mail[0].length)})}
        catch (error) {console.log("the element didn't appear 2nd time !")}
      }
    await page2.close();
    await page.bringToFront(); 
  }
    
    



  const csv = new ObjectsToCsv(mails);
     

  await csv.toDisk('./test.csv');
  console.log('test')

  console.log(await csv.toString());
    
   
  browser.close()
}

// Appelle la fonction getData() et affichage les données retournées
getData()










