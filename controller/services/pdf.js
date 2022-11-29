import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import * as reports from '../api/admin_api.js';

let count = 1;

export const createPdf = async () => {

    const dataToDisplay = {
        yearReport: await reports.totalProductsSalesYearCount(2022)
    };

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const folderPath = path.join(process.cwd(), 'views', 'pdf-templates');
    const pageFileData = await fs.readFile(folderPath + '/report.ejs', 'utf-8');
    const resultFolderPath = path.join(process.cwd(), 'reports');

    try {
        const pageContent = ejs.render(pageFileData, dataToDisplay);

        await page.setContent(pageContent);
        await page.addStyleTag({ path: folderPath + '/style.css' });
        await page.emulateMediaType('screen');
        await page.pdf({
            path: resultFolderPath + '/report.pdf',
            format: 'A4',
            printBackground: true
        });
        await browser.close();
    } catch (error) {
        console.log(error);
    }

    return (`PDF-${count++}?  DONE :)`);
};

// createPdf()

async function test() {
    while (true) {
        console.log(await createPdf());
    };
};

// test();