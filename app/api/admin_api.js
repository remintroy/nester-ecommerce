import * as db from '../services/schema.js';

// get products added at ( n ) hours ago
export const productsDataInPastHours = async (hoursAgo) => {
    try {
        // confirming hoursAgo is a number
        if (isNaN(Number(hoursAgo)) || Number(hoursAgo || !hoursAgo) < 1) throw 'Invalid query parameters';

        return await db.products.aggregate([
            {
                $match: {
                    'creationTime': {
                        $gte: (new Date(new Date() - 1 * 60 * 60 * hoursAgo * 1000))
                    }
                }
            },
            {
                $sort: {
                    'creationTime': -1
                }
            }
        ]);
    } catch (error) {
        throw 'Error fetching products data form db';
    };
};
// get orders at ( n ) hours ago
export const ordersDataInPastHours = async (hoursAgo) => {
    try {

        // confirming hoursAgo is a number
        if (isNaN(Number(hoursAgo)) || Number(hoursAgo || !hoursAgo) < 1) reject('Invalid query parameters');

        // getting data form db and resolving...
        return await db.orders.aggregate([
            {
                $unwind: '$orders'
            },
            {
                $match: {
                    'orders.dateOFOrder': {
                        $gte: (new Date(new Date() - 1 * 60 * 60 * hoursAgo * 1000))
                    }
                }
            },
            {
                $sort: {
                    'orders.dateOFOrder': 1
                }
            }
        ]);

    } catch (error) {
        throw 'Error fetchign orders data form db';
    };
};
// get category usage at ( n ) hours ago
export const categoryUsageInPastHours = async (hoursAgo) => {
    try {

        const output = {};
        const data = await db.category.aggregate([
            {
                $lookup: {
                    from: 'products',
                    let: { category: '$category' },
                    pipeline: [
                        {
                            $match: {
                                'category': '$$category',
                            }
                        }
                    ],
                    as: 'products'
                }
            }
        ]);

        return data;
    } catch (error) {
        console.log(error);
        throw 'Error while fetching category data form db';
    };
};
export const salesInPastDate = () => {

}

export const totalProductNetWorth = async (hoursAgo) => {
    try {
        const data = await db.products.aggregate([
            {
                $addFields: {
                    netTotal: {
                        $multiply: [
                            { $subtract: ['$price', '$offer'] },
                            '$stock'
                        ]
                    },
                    total: { $subtract: ['$price', '$offer'] }
                }
            },
            {
                $group: {
                    _id: 'netTotalOfAll',
                    AllProductsNetTotal: { $sum: '$netTotal' },
                    products: { $addToSet: '$$ROOT' }
                }
            },
            { $unwind: '$products' },
            { $addFields: { 'products.AllProductsNetTotal': '$AllProductsNetTotal' } },
            {
                $replaceRoot: {
                    newRoot: '$products'
                }
            },
            {
                $sort: {
                    creationTime: -1
                }
            },
            {
                $match: {
                    'lastPurchased': {
                        $gte: (new Date(new Date() - 1 * 60 * 60 * hoursAgo * 1000))
                    }
                }
            }
        ]);
        return data;
    } catch (error) {
        console.log(error);
        throw 'Error fetching product data form server';
    }
};


// 
export const getProductInPages = async (pages) => {
    // validating request values
    if (isNaN(Number(pages)) || Number(pages) < 1 || !pages) throw ('Invalid query parameters');

    try {
        // number of products to list on each page
        const listLenght = 5;
        const outputData = {};

        outputData.length = listLenght;

        const countFromDb = await db.products.aggregate([{ $group: { _id: 'totalLenght', sum: { $sum: 1 } } }]);
        outputData.totalCount = countFromDb[0].sum;

        // getting and resolvind data
        outputData.data = await db.products.aggregate([
            { $sort: { 'creationTime': 1 } },
            { $skip: ((pages - 1) * listLenght) },
            { $limit: listLenght }
        ]);

        return outputData;

    } catch (error) {
        throw 'Error while fetching data from db';
    };
};

async function test() {
    try {
        const data = await getProductInPages(2);
        console.log("data => ", data);
    } catch (error) {
        console.log("error =>", error);
    }
}
// test()