import * as db from './schema.js';

export const search = async (query, pages) => {
    try {

        query = query?.trim();

        // let outputData = await db.products.find(
        //     { $text: { $search: query } },
        //     { score: { $meta: "textScore" } }
        // ).sort({ score: { $meta: "textScore" } });

        let outputData;

        let projection = {
            _id: 0,
            views: 0,
            impressions: 0, addedToCart: 0,
            interactions: 0,
            reachedCheckout: 0,
            purchased: 0,
            cancelled: 0,
            productsListingViews: 0,
            purchaseCompleted: 0,
        }

        if (query) {

            outputData = await db.products.aggregate([
                {
                    $match: {
                        $or: [
                            { title: new RegExp(`^${(query + "").trim()}`, `i`), },
                            { category: new RegExp(`^${(query + "").trim()}`, `i`), }
                        ]
                    }
                },
                {
                    $project: projection
                }
            ]);

        } else {

            outputData = await db.products.find({}, projection);

        };

        // returning result
        return outputData;

    } catch (error) {
        // error handling
        throw error.message ?
            { status: 'error', ...error } :
            { status: 'error', ...util.errorMessage(error ? error : 'Oops something went wrong', 500) };
    };
};

async function test() {
    try {
        const result = await search('lamp', 1);
        console.log('TEST_RESUTL => ', result);
    } catch (error) {
        console.log('TEST_ERR => ', error);
    }
}
// test();