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
            existingProductWL = await db.wishList.find({ 'products.PID': PID });
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