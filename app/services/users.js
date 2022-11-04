import * as auth from './auth.js';
import * as products from './products.js';
import * as db from './schema.js';


/**
 * add product to cart || increases quantity
 * if quantity is provided it is used else increase by one on each update
 * @param {String} UID 
 * @param {String} PID 
 * @param {Number} quantity 
 * @returns <Promise> with message 
 */
export const addProductToCart = (UID, PID, quantity) => {

    const MAX_PRODUCT_QUANTITY = 10000;

    return new Promise(async (resolve, reject) => {
        try {

            // checks if user id is valid
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            // check if product id is valid
            const productOutput = await products.validatior({ PID: PID }, { PID: true }, 'updateproduct');

            try {
                const checkForCartDB = await db.cart.find({ UID: userOutput.UID });
                if (checkForCartDB.length > 0) {
                    try {
                        // checks if the same product exists on cart

                        let isThisPIDExists = false;
                        let isThisPIDExistsIndex = false;

                        checkForCartDB[0].products.forEach((item, index) => {
                            if (item.PID == productOutput.PID) {
                                isThisPIDExists = true;
                                isThisPIDExistsIndex = index;
                            };
                        });

                        // product already exist on cart
                        if (isThisPIDExists) {
                            // updating quantity of product
                            try {
                                if (
                                    isNaN(Number(quantity)) == false &&
                                    quantity > 0 &&
                                    quantity <= MAX_PRODUCT_QUANTITY
                                ) {
                                    // update product quantity with new value
                                    const updatingProductQuantity = await db.cart.updateOne({ UID: userOutput.UID }, {
                                        $set: {
                                            [`products.${isThisPIDExistsIndex}.updated`]: new Date(),
                                            [`products.${isThisPIDExistsIndex}.quantity`]: quantity
                                        }
                                    });
                                    resolve("Product updated"); return 0;
                                } else {
                                    // increase product quantity 
                                    const updatingProductQuantity = await db.cart.updateOne({ UID: userOutput.UID }, {
                                        $inc: {
                                            [`products.${isThisPIDExistsIndex}.quantity`]: 1
                                        },
                                        $set: {
                                            [`products.${isThisPIDExistsIndex}.updated`]: new Date()
                                        }
                                    });
                                    resolve("Product updated"); return 0;
                                };
                            } catch (error) {
                                console.log('Error => ',error);
                                reject('Oops someting went wrong'); return 0;
                            };
                        } else {
                            // adding new product to cart
                            try {
                                const addNewProductToDB = await db.cart.updateOne({ UID: userOutput.UID }, {
                                    $push: {
                                        products: {
                                            PID: productOutput.PID
                                        }
                                    }
                                });
                                resolve("Product added"); return 0;
                            } catch (error) {
                                console.log('Error => ',error);
                                reject("Oops something went wrong"); return 0;
                            };
                        };

                    } catch (error) {
                        console.error("error=>", error);
                        reject('Error adding product to cart'); return 0;
                    };
                } else {
                    // cart not exist for this user on cart collection
                    try {
                        // adds products to cart
                        const addedData = await db.cart({
                            UID: userOutput.UID,
                            products: [
                                {
                                    PID: productOutput.PID,
                                    quantity: quantity ? quantity : 1
                                }
                            ]
                        });
                        addedData.save();
                        resolve("Product added");
                    } catch (error) {
                        console.log('Error => ',error);
                        reject('Error adding to cart'); return 0;
                    };
                };
            } catch (error) {
                console.log('Error => ',error);
                reject("Oops something went wrong"); return 0;
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};

