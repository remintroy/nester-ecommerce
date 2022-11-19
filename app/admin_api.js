import * as apiService from './api/admin_api.js';

// serves reports of sales
export const reports = async (req, res) => {
    try {
        //...  availabe api query's
        const validKeys = ['products', 'orders', 'category', 'sales'];
        const keys = Object.keys(req.query);
        let isGoodQuery = false;

        // findig the existatnce of any valid key in query
        for (let i = 0; i < validKeys.length; i++) {
            const valid = validKeys[i];
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                if (valid == key) isGoodQuery = true;
                break;
            };
            if (isGoodQuery) break;
        };

        // error message for no valid key's
        if (!isGoodQuery) throw `Can't find any valid querys`;

        const { products, orders, request, category, sales } = req.query;
        const output = {}; // accumilator for the output data

        // all services 
        if (products) output.producs = await apiService.productsDataInPastHours(products);
        if (orders) output.orders = await apiService.ordersDataInPastHours(orders);
        if (category) output.category = await apiService.categoryUsageInPastHours(category);
        if (sales) output.sales = await apiService.totalProductNetWorth(sales);

        // final data
        res.send(output);

    } catch (error) {
        // error data
        res.send({ status: 'error', message: error });
    };
};

// api for producst data 
export const producs = async (req, res) => {
    try {
        //...  availabe api query's
        const validKeys = [];

        validKeys.push({
            key: 'pages',
            service: 'getProductInPages'
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