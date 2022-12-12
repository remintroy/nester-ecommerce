import * as db from './schema.js';
import { validatior } from './auth.js';

// add product to wishlist
export const add = async (UID, PID) => {
    try {

        // validating user data
        const userOutput = await validatior({ UID: UID });

        //---------------- checks and fetch products data -------------
        let existingProduct;

        try {
            // getching product data
            existingProduct = await db.products.find({ PID: PID });
            //..
        } catch (error) {
            // hanlding error
            throw 'Error fetching product data';
        };

        // checks if product exist or not
        if (existingProduct.length == 0) throw 'Product with this PID not exist !';


        // -----------  checks product on wishlisht collection ---------------
        let existingProductWL;
        let existingDocWL;

        try {
            // getting data from wishlisterror
            existingProductWL = await db.wishList.find({ UID: UID, 'products.PID': PID });
            existingDocWL = await db.wishList.find({ UID: UID });
            // ...
        } catch (error) {
            // handling error
            throw 'Error fetching product data !';
        };

        // check if product is already of wishlist
        if (existingProductWL.length > 0) return 'Product already added !';

        // document already exists
        if (existingDocWL.length > 0) {
            try {
                //
                // update by pushing new product to products array
                const data = await db.wishList.updateOne({ UID: UID }, {
                    $push: {
                        products: {
                            PID: PID,
                            date: new Date()
                        }
                    }
                });
            } catch (error) {
                //..
                throw 'Faild to add product to wishlist';
            };
        } else {
            // create new document 
            const data = await db.wishList({
                UID: UID,
                products: [{
                    PID: PID,
                    date: new Date()
                }]
            });

            data.save();
        };

        // Misson complted !
        return 'Product successfully added to wishlist';

    } catch (error) {
        // handling error
        throw error;
    };
};
// get data from wishlist
export const getAll = async (UID) => {
    try {

        // validating user id
        const userOutput = await validatior({ UID: UID });

        let wishListDoc;

        try {
            // gettin data from db
            wishListDoc = await db.wishList.aggregate([
                { $match: { UID: UID } },
                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: 'products',
                        foreignField: 'PID',
                        localField: 'products.PID',
                        as: 'doc'
                    }
                },
                {
                    $project: {
                        'doc.views': 0,
                        'doc.reachedCheckout': 0,
                        'doc.interactions': 0,
                        'doc.impressions': 0,
                        'doc.purchaseCompleted': 0,
                        'doc.cancelled:': 0,
                        'doc.purchased': 0,
                        'doc.productsListingViews': 0,
                        'doc.addedToCart:': 0,
                    }
                },
                {
                    $addFields: {
                        doc: { arrayElemAt: ['$doc', 0] }
                    }
                }
            ]);

        } catch (error) {
            // handling error
            throw 'Faild to fetch data';
        };

        // resolving with data
        return wishListDoc;

    } catch (error) {
        throw error;
    };
};
// delete product
export const remove = async (UID, PID) => {
    try {

        // validating user id
        const userOutput = await validatior({ UID: UID });

        let existingData;

        try {
            // fetching data from db
            existingData = await db.wishList.find({ UID: UID, 'products.PID': PID });

        } catch (error) {
            throw 'Faild to fetch data';
        };

        if (existingData.length == 0) throw 'Nothing to remove';

        const removed = await db.wishList.updateOne({ UID: UID }, {
            $pull: {
                'products': { PID: PID }
            }
        });

        return 'Product successfully removed';

    } catch (error) {
        // handling error
        console.log(error);
        throw error;
    }
};