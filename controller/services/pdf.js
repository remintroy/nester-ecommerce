// import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import pdf from 'html-pdf';
import * as reports from '../api/admin_api.js';

let count = 1;

export const createPdf = () => {
    return new Promise(async (resolve, reject) => {
        try {
            
        // data to use in pdf
        const dataToDisplay = { yearReport: await reports.totalProductsSalesYearCount(2022) };

        // path of ejs template
        const templateDirPath = path.join(process.cwd(), 'views', 'pdf-templates');
        const templateFilePath = path.join(templateDirPath, 'report.ejs');

        // rendering pdf template
        const renderedTemplate = await ejs.renderFile(templateFilePath, dataToDisplay);

        const data = pdf.create(renderedTemplate, {
            height: "11.25in",
            width: "8.5in",
            header: {
                height: "0mm"
            },
            footer: {
                height: "0mm",
            },
            childProcessOptions: {
                env: {
                    OPENSSL_CONF: '/dev/null',
                },
            }
        })
            .toFile(path.join(templateDirPath, 'report.pdf'), (err, data) => {
                console.log(++count);
                resolve(data);
            });

        } catch (error) {
            resolve(error)            
        }
    });
};

async function test() {
    while (true) {
        console.log(await createPdf());
    };
};
test()