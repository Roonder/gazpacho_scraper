
import { load } from "cheerio"
import puppeteer from "puppeteer";
import * as fs from "fs"

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    // await page.setViewport({width: 1080, height: 1024});
    await page.goto("https://tecnoblue.us.qlikcloud.com/", {waitUntil: "networkidle0"});
    // Login
    await page.waitForNetworkIdle({idleTime: 3e3})
    await page.waitForSelector('button[type="submit"]', {timeout: 10e3});
    // await page.waitForSelector('input[type="email"]', {timeout: 10e3});
    await page.type('input[type="email"]', 'N/A');
    await page.type('input[type="password"]', "N/A");
    await page.click('button[type="submit"]');
    // Main Menu
    await page.waitForNetworkIdle({idleTime: 2e3})
    await page.goto("https://tecnoblue.us.qlikcloud.com/console/events", {waitUntil: "networkidle0"});
    // Management Console
    await page.waitForSelector("a[data-testid='nav-menu__events']");
    await page.click("a[data-testid='nav-menu__events']");
    await page.waitForSelector("table tbody tr[data-testid*='table-row']");
    await page.waitForSelector("input[class*='management-console-seed']");
    await page.click("input[class*='management-console-seed']");
    await page.click("li:last-of-type");
    await page.waitForNetworkIdle({idleTime: 15e2})
    
    let dataArray = [];
    let is_disabled = false;

    while(!is_disabled) {

        let content = await page.content();
        const $ = load(content);
    
        const dataTempArray = $('table tbody tr[data-testid*="table-row"]').toArray().map(row => {
            const rowDate = $(row).find('td[data-testid="table-cell-0"] > span').text();
            const rowUser = $(row).find('td[data-testid="table-cell-3"] span').text();
    
            return {
                user: rowUser,
                date: rowDate
            }
        }).filter(row => row.user !== '');

        dataArray = [...dataArray, ...dataTempArray];

        await page.evaluate(() => {
            window.scrollTo(0, window.document.body.scrollHeight);
          });
        await page.waitForSelector("button[title='Next page']");

        if(!is_disabled) {
            await page.click("button[title='Next page']");
            is_disabled = await page.evaluate(() => document.querySelector('button[title="Next page"][disabled]') !== null);
            console.log("is disabled? ", is_disabled)
        }
    }

    const json = fs.writeFile('reporte_quincenal.json',
        JSON.stringify(dataArray, null, 2),
        (err) => {
            if(err) {
                console.log(err)
            } else {
                console.log('JSON creado correctamente ✅')
            }
        }
    )

    console.log('Textico agarrao: ', json);

    await browser.close();

})();

// $('table tbody tr[data-testid*="table-row"]').toArray().map(row => {
//     const rowDate = $(row).find('td[data-testid="table-cell-0"] > span').text();
//     const rowUser = $(row).find('td[data-testid="table-cell-3"] span').text();

//     return {
//         user: rowUser,
//         date: rowDate
//     }
// }).filter(row => row.user !== '')