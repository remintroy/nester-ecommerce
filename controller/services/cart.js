import * as auth from './auth.js';
import * as products from './products.js';
import * as db from './schema.js';
import * as analytics from './analytics.js';
import * as util from './util.js';

const MAX_PRODUCT_QUANTITY = 100;

export const getSingleProductWithTotal = (UID, PID) => {
    return new Promise(async (resolve, reject) => {
        try {
            // checks if user id is valid
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            // check if product id is valid
            const productOutput = await products.validatior({ PID: PID }, { PID: true }, 'updateproduct');
            try {
                const productData = await db.cart.aggregate([
                    {
                        $match: { UID: userOutput.UID }
                    },
                    { $unwind: '$products' },
                    {
                        $lookup: {
                            from: 'products',
                            foreignField: "PID",
                            localField: 'products.PID',
                            as: 'details'
                        }
                    },
                    {
                        $match: {
                            'details.PID': {
                                $exists: true,
                                $ne: null
                            }
                        }
                    },
                    {
                        $project: {
                            PID: '$products.PID',
                            price: { $arrayElemAt: ['$details.price', 0] },
                            offer: { $arrayElemAt: ['$details.offer', 0] },
                            quantity: '$products.quantity',
                            stock: { $arrayElemAt: ['$details.stock', 0] },
                            total: {
                                $multiply: [
                                    '$products.quantity',
                                    {
                                        $subtract: [
                                            {
                                                $arrayElemAt: ['$details.price', 0]
                                            },
                                            {
                                                $arrayElemAt: ['$details.offer', 0]
                                            },
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: 'cartSubTotal',
                            subTotal: { $sum: '$total' },
                            totalCount: { $sum: '$quantity' },
                            product: { $addToSet: '$$ROOT' },
                        }
                    },
                    { $unwind: '$product' },
                    {
                        $match: { 'product.PID': productOutput.PID }
                    },
                    {
                        $project: {
                            _id: 0,
                            'product._id': 0
                        }
                    }
                ]);

                for (const product of productData) {
                    try {
                        await analytics.addProductImpressions(product.product.PID);
                    } catch (error) {
                        //...
                    };
                };

                resolve(productData[0]);
            } catch (error) {
                reject('Error fetching product data');
            };
        } catch (error) {
            reject(error);
        };
    });
};
export const getAllProductsWithTotal = (UID) => {
    return new Promise(async (resolve, reject) => {
        try {
            // checks if user id is valid
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            try {
                const products = await db.cart.aggregate([
                    { $match: { UID: userOutput.UID } },
                    { $unwind: "$products" },
                    { $sort: { 'products.updated': -1 } },
                    {
                        $lookup: {
                            from: 'products',
                            localField: 'products.PID',
                            foreignField: 'PID',
                            as: 'cartProducts'
                        }
                    },
                    {
                        $addFields: {
                            'cartProducts.quantity': '$$ROOT.products.quantity',
                            'cartProducts.updated': '$$ROOT.products.updated',
                            'cartProducts.total': {
                                $multiply: [
                                    '$$ROOT.products.quantity',
                                    {
                                        $subtract: [
                                            { $arrayElemAt: ['$$ROOT.cartProducts.price', 0] },
                                            { $arrayElemAt: ['$$ROOT.cartProducts.offer', 0] }
                                        ]
                                    }
                                ]
                            },
                        }
                    },
                    {
                        $group: {
                            _id: '$products.PID',
                            product: { $push: { $arrayElemAt: ['$cartProducts', 0] } }
                        }
                    },
                    {
                        $match: {
                            'product.PID': {
                                $exists: true,
                                $ne: null
                            }
                        }
                    },
                    {
                        $group: {
                            _id: { $arrayElemAt: ['$product.PID', 0] },
                            product: { $push: { $arrayElemAt: ['$product', 0] } }
                        }
                    },
                    { $project: { product: { $arrayElemAt: ['$product', 0] } } },
                    { $replaceRoot: { newRoot: "$product" } },
                    {
                        $group: {
                            _id: "subTotal",
                            subTotal: { $sum: '$total' },
                            products: { $addToSet: '$$ROOT' },
                            quantity: { $sum: '$quantity' }
                        }
                    },
                    {
                        $addFields: {
                            'products.subTotal': '$subTotal',
                            'products.totalCount': '$quantity'
                        }
                    },
                    { $unwind: '$products' },
                    { $replaceRoot: { newRoot: "$products" } },
                    { $project: { _id: 0 } }
                ]);
                for (const product of products) {
                    try {
                        await analytics.addProductImpressions(product.PID);
                    } catch (error) {
                        //...
                    };
                };
                resolve(products);
            } catch (error) {
                console.log(error)
                reject('Error fetching product data');
            };
        } catch (error) {
            reject(error);
        };
    });
};
export const deleteProduct = (UID, PID) => {
    return new Promise(async (resolve, reject) => {
        try {
            // validating inputs
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            const productOutput = await products.validatior({ PID: PID }, { PID: true }, 'updateproduct');

            try {

                const formDb = await db.cart.updateOne({ UID: userOutput.UID }, {
                    $pull: {
                        'products': { PID: productOutput.PID }
                    }
                });
                if (formDb.modifiedCount == 0) {
                    reject('Nothing to remove');
                } else {
                    const result = await getAllProductsWithTotal(userOutput.UID);
                    const output = {
                        subTotal: result[0]?.subTotal ? result[0].subTotal : 0,
                        totalCount: result.length
                    }
                    resolve(output); return 0;
                };

            } catch (error) {
                console.log(error);
                reject('Oops something went wrong');
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};
export const addProduct = (UID, PID, quantity) => {
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
                        let isThereAnError = false;

                        checkForCartDB[0].products.forEach((item, index) => {
                            if (item.PID == productOutput.PID) {
                                isThisPIDExists = true;
                                isThisPIDExistsIndex = index;
                                if (item.quantity > MAX_PRODUCT_QUANTITY && quantity > MAX_PRODUCT_QUANTITY || quantity > MAX_PRODUCT_QUANTITY) {
                                    isThereAnError = true;
                                    throw "Cart Limit Exeeded";
                                };
                            };
                        });


                        if (!isThereAnError) {

                            try {
                                // product already exist on cart
                                if (isThisPIDExists) {
                                    // updating quantity of product
                                    // check for product quantity
                                    const productDataFromProducts = await db.products.findOne({ PID: productOutput.PID });

                                    try {

                                        // checks if products stock is available
                                        if (productDataFromProducts.stock <= checkForCartDB[0].products[isThisPIDExistsIndex].quantity) {
                                            if (quantity) {
                                                if (quantity > productDataFromProducts.stock) {
                                                    throw 'Out of stock';
                                                };
                                            } else {
                                                if (1 > productDataFromProducts.stock) {
                                                    throw 'Out of stock';
                                                };
                                            };
                                        };

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

                                                const updatedValues = await getSingleProductWithTotal(userOutput.UID, productOutput.PID);
                                                resolve(updatedValues); return 0;
                                                // resolve("Product updated"); return 0;
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

                                                const updatedValues = await getSingleProductWithTotal(userOutput.UID, productOutput.PID);
                                                resolve(updatedValues); return 0;
                                            };
                                        } catch (error) {
                                            reject('Oops someting went wrong'); return 0;
                                        };
                                    } catch (error) {
                                        reject(error); return 0;
                                    };

                                } else {
                                    // adding new product to cart
                                    const productDataFromProducts = await db.products.findOne({ PID: productOutput.PID });

                                    try {

                                        // checks if products stock is available
                                        if (true) {
                                            if (quantity) {
                                                if (quantity > productDataFromProducts.stock) {
                                                    throw 'Out of stock';
                                                };
                                            } else {
                                                if (1 > productDataFromProducts.stock) {
                                                    throw 'Out of stock';
                                                };
                                            };
                                        };

                                        try {
                                            const addNewProductToDB = await db.cart.updateOne({ UID: userOutput.UID }, {
                                                $push: {
                                                    products: {
                                                        PID: productOutput.PID,
                                                        quantity: quantity ? quantity : 1
                                                    }
                                                }
                                            });

                                            const updatedValues = await getSingleProductWithTotal(userOutput.UID, productOutput.PID);
                                            resolve(updatedValues); return 0;
                                        } catch (error) {
                                            console.log('Error => ', error);
                                            reject("Oops something went wrong"); return 0;
                                        };

                                    } catch (error) {
                                        reject(error); return 0;
                                    };
                                };
                            } catch (error) {
                                console.log(error)
                                reject('Oops someting went wrong'); return 0;
                            };
                        };

                    } catch (error) {
                        // console.error("error=>", error); // TODO: remove log
                        reject(error); return 0;
                    };
                } else {
                    // cart not exist for this user on cart collection
                    const productDataFromProducts = await db.products.findOne({ PID: productOutput.PID });

                    // checks if products stock is available
                    if (productDataFromProducts.stock <= checkForCartDB[0]?.products[isThisPIDExistsIndex]?.quantity) throw 'Out of stock';
                    if (quantity) {
                        if (quantity > productDataFromProducts.stock) {
                            throw 'Out of stock';
                        };
                    };


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

                        const updatedValues = await getSingleProductWithTotal(userOutput.UID, productOutput.PID);
                        resolve(updatedValues); return 0;
                    } catch (error) {
                        // console.log('Error => ', error); // TODO : remove log
                        reject('Error adding to cart'); return 0;
                    };
                };
            } catch (error) {
                console.log(error);
                // console.log('Error => ', error); // TODO : remove log
                reject("Oops something went wrong"); return 0;
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};

// const add = async (UID, PID, quantity) => {
//     try {

//         // start by validating user
//         const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
//         // check if product id is valid
//         const productOutput = await products.validatior({ PID: PID }, { PID: true }, 'updateproduct');

//         let checkForCartDB;

//         try {
//             // finding data form db with UID;
//             checkForCartDB = await db.cart.find({ UID: userOutput.UID });

//         } catch (error) {
//             // error handling
//             throw util.errorMessage('Error fetching data for cart', 500);
//         };


//         throw util.errorMessage('Some error'); // TODO


//     } catch (error) {
//         throw error?.error ? error : {...util.errorMessage(error, 400),action:'error'};
//     };
// };

const test = async () => {
    try {
        const data = await add('6pxw23gPVG0AlKh3IE6or782V','Xa3aTKovaH_bFJ7OxS09',2);
        console.log('TEST_RESULT => ', data);
    } catch (error) {
        console.log('TEST_ERR => ', error);
    }
};
test()