// import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';
import pdf from 'html-pdf';
import * as reports from '../api/admin_api.js';
import easyInvoice from 'easyinvoice';
import { getByOrderID } from './orders.js';

// yearly sales report for admin
export const reportYearly = () => {
    return new Promise(async (resolve, reject) => {
        try {

            // data to use in pdf
            const dataToDisplay = { yearReport: await reports.totalProductsSalesYearCount(new Date().getFullYear()) };

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
                .toFile(path.join(process.cwd(), 'reports', 'report.pdf'), (err, data) => {
                    resolve(data);
                });

        } catch (error) {
            resolve(error)
        }
    });
};

let count = 1;

// order invoice for user // TODO : this is incomplete
export const orderInvoice = async (orderID) => {
    try {

        const orderData = await getByOrderID(orderID);
        const productsData = [];

        for (const { order: { products: product } } of orderData) {
            productsData.push({
                quantity: product.quantity,
                description: product.title,
                'tax-rate': 0,
                price: product.price - product?.offer
            });
        };

        const data = {
            "images": {
                "logo": "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"
            },
            "sender": {
                "company": "Sample Corp",
                "address": "Sample Street 123",
                "zip": "1234 AB",
                "city": "Sampletown",
                "country": "Samplecountry"
            },
            "client": {
                "company": "Client Corp",
                "address": "Clientstreet 456",
                "zip": "4567 CD",
                "city": "Clientcity",
                "country": "Clientcountry"
            },
            "information": {
                "number": "2022.0001",
                "date": "1.1.2022",
                "due-date": "15.1.2022"
            },
            "products": productsData,
            "bottom-notice": "Kindly pay your invoice within 15 days.",
            "settings": {
                "currency": "INR",
                "tax-notation": "vat",
                "margin-top": 25,
                "margin-right": 25,
                "margin-left": 25,
                "margin-bottom": 25
            }

        };

        const folder = path.join(process.cwd(), 'reports');
        const invoiceBase64 = await easyInvoice.createInvoice(data);
        const saveFile = await fs.writeFileSync(folder + '/invoice.pdf', invoiceBase64.pdf, 'base64');

        return saveFile;

    } catch (error) {
        throw error;
    };
};

async function test() {
    // while (true) {
    const date = new Date();
    console.log((await orderInvoice('KKVgdVASsZ5p7_jpCYqQ')));
    console.log('Delay => ', new Date() - date);
    // };
};
// test()