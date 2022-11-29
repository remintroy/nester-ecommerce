import * as apiService from './api/admin_api.js';

// serves reports of sales
export const reports = async (req, res) => {
    try {
        //...  availabe api query's
        const validKeys = [];

        // ----- products ------

        // get products data in past hours
        validKeys.push({
            key: 'products-hour',
            service: 'productsDataInPastHours'
        });

        // get total net worth of products
        validKeys.push({
            key: 'products-networth-hour',
            service: 'totalProductNetWorth'
        });

        // ----- orders -------

        // get order data in past hours
        validKeys.push({
            key: 'orders-hour',
            service: 'ordersDataInPastHours'
        });

        // get order data by year
        validKeys.push({
            key: 'orders-year',
            service: 'salesInYear'
        });

        validKeys.push({
            key: 'orders-year-count',
            service: 'salesInYear_count'
        });

        validKeys.push({
            key: 'order-all-year',
            service: 'totalProductsSalesYear'
        });

        validKeys.push({
            key: 'order-all-year-count',
            service: 'totalProductsSalesYearCount'
        });

        // ----- category -----

        // get category data in past hours
        validKeys.push({
            key: 'category-hour',
            service: 'categoryUsageInPastHours'
        });

        // ----- views ------
        validKeys.push({
            key: 'requests-today',
            service: 'userViewsInDay'
        });

        validKeys.push({
            key: 'pages-today',
            service: 'getRequestByPages'
        });

        const keys = Object.keys(req.query);
        let isGoodQuery = false;
        // findig the existatnce of any valid key in query
        for (let i = 0; i < validKeys.length; i++) {
            const valid = validKeys[i].key;
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                if (valid == key) {
                    isGoodQuery = true;
                    break;
                };
            };
            if (isGoodQuery) break;
        };

        // error message for no valid key's
        if (!isGoodQuery) throw `Can't find any valid querys`;

        const output = {}; // accumilator for the output data
        const query = req.query;

        // all services 
        for (const i of validKeys) {
            if (query[i.key]) output[i.key] = await apiService[i.service](query[i.key]);
        };

        // final data
        res.send(output);
    } catch (error) {
        // error data
        res.send({ status: 'error', message: error });
    };
};

// api for producst data 
export const products = async (req, res) => {
    try {
        //...  availabe api query's
        const validKeys = [];

        validKeys.push({
            key: 'pages',
            service: 'getProductInPages'
        });

        validKeys.push({
            key: 'analytics-pid',
            service: 'getProductsStatByPID'
        })

        const keys = Object.keys(req.query);
        let isGoodQuery = false;
        // findig the existatnce of any valid key in query
        for (let i = 0; i < validKeys.length; i++) {
            const valid = validKeys[i].key;
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                if (valid == key) isGoodQuery = true;
                break;
            };
            if (isGoodQuery) break;
        };

        // error message for no valid key's
        if (!isGoodQuery) throw `Can't find any valid querys`;

        const output = {}; // accumilator for the output data
        const query = req.query;

        // all services 
        for (const i of validKeys) {
            if (query[i.key]) output[i.key] = await apiService[i.service](query[i.key]);
        };

        // final data
        res.send(output);

    } catch (error) {
        // error data
        res.send({ status: 'error', message: error });
    };
};

