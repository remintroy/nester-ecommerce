import * as auth from './auth.js';
import * as products from './products.js';
import * as db from './schema.js';

const getSingleProductWithTotalFromCart = (UID, PID) => {
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
                resolve(productData[0]);
            } catch (error) {
                reject('Error fetching product data');
            };
        } catch (error) {
            reject(error);
        };
    });
};
const getAllProductsWithTotalFormCart = (UID) => {
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
const createAndAddAddress = (UID, address) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, phone, country, houseNumber, streetNumber, town, state, postalCode, email } = address;
            const data = await db.address({
                UID: UID,
                address: [
                    {
                        name: name,
                        phone: phone,
                        country: country,
                        houseNumber: houseNumber,
                        streetNumber: streetNumber,
                        town: town,
                        state: state,
                        postalCode: postalCode,
                        email: email,
                        type: 'primary'
                    }
                ]
            });
            data.save();
            resolve("Address successfully added");
        } catch (error) {
            reject('Error adding address to db');
        };
    });
};
const addToExistingAddress = (UID, existingData, address) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { name, phone, country, houseNumber, streetNumber, town, state, postalCode, email } = address;

            const data = await db.address.updateOne({ UID: UID }, {
                $push: {
                    address: {
                        type: existingData[0].address?.length > 0 ? "secondary" : 'primary',
                        name: name,
                        phone: phone,
                        country: country,
                        houseNumber: houseNumber,
                        streetNumber: streetNumber,
                        town: town,
                        state: state,
                        postalCode: postalCode,
                        email: email
                    }
                }
            });
            resolve("Address successfully added");
        } catch (error) {
            reject('Error adding address to db');
        };
    });
};
const updateAddress = (UID, existingData, newAddress) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { addressID } = newAddress;
            // index of existing address
            const index = existingData[0].address.map(e => e._id == addressID).indexOf(true);
            let finalOutput;

            if (index == -1) finalOutput = await addToExistingAddress(UID, existingData, newAddress);
            else {
                // updating existing address

                const keys = Object.keys(newAddress);
                const output = {};

                keys.forEach((e, i, a) => {
                    if (newAddress[e] && e != 'addressID' && e != 'UID') {
                        output[`address.${index}.${e}`] = newAddress[e];
                    };
                });

                try {
                    finalOutput = await db.address.updateOne({ UID: UID }, {
                        $set: output
                    });
                } catch (error) {
                    reject('Error updating to db');
                };
            };

            resolve(finalOutput);

        } catch (error) {
            console.log('error=>', error);
            reject("Error updating address to db");
        };
    });
};

export const addressValidator = (UID, address) => {
    return new Promise(async (resolve, reject) => {

        const { name, phone, country, houseNumber, streetNumber, town, state, postalCode, email, addressID } = address;

        try {
            const userOutput = await auth.validatior(
                {
                    UID: UID,
                    name: name,
                    phone: phone,
                    email: email,
                    country: country
                },
                {
                    UIDRequired: true
                }
            );

            if (isNaN(Number(houseNumber)) && houseNumber || houseNumber < 1) throw 'Invalid house number';
            else userOutput.houseNumber = houseNumber;

            if (isNaN(Number(streetNumber)) && streetNumber || streetNumber < 1) throw 'Invalid street number';
            else userOutput.streetNumber = streetNumber;

            if (isNaN(Number(postalCode)) && postalCode || postalCode < 1) throw 'Invalid postal code';
            else userOutput.postalCode = postalCode;

            if (town) userOutput.town = town;
            if (state) userOutput.state = state;
            if (addressID) userOutput.addressID = addressID;

            resolve(userOutput);
        } catch (error) {
            reject(error);
        };
    });
};
/**
 * add product to cart || increases quantity
 * if quantity is provided it is used else increase by one on each update
 * @param {String} UID 
 * @param {String} PID 
 * @param {Number} quantity 
 * @returns <Promise> with message 
 */
export const addProductToCart = (UID, PID, quantity) => {

    const MAX_PRODUCT_QUANTITY = 100;

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
                                    const updatedValues = await getSingleProductWithTotalFromCart(userOutput.UID, productOutput.PID);
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
                                    const updatedValues = await getSingleProductWithTotalFromCart(userOutput.UID, productOutput.PID);
                                    resolve(updatedValues); return 0;
                                };
                            } catch (error) {
                                console.log('Error => ', error);
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
                                const updatedValues = await getSingleProductWithTotalFromCart(userOutput.UID, productOutput.PID);
                                resolve(updatedValues); return 0;
                            } catch (error) {
                                console.log('Error => ', error);
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
                        const updatedValues = await getSingleProductWithTotalFromCart(userOutput.UID, productOutput.PID);
                        resolve(updatedValues); return 0;
                    } catch (error) {
                        console.log('Error => ', error);
                        reject('Error adding to cart'); return 0;
                    };
                };
            } catch (error) {
                console.log('Error => ', error);
                reject("Oops something went wrong"); return 0;
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};
export const deleteFormCart = (UID, PID) => {
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
                    const result = await getAllProductsWithTotalFormCart(userOutput.UID);
                    const output = {
                        subTotal: result[0]?.subTotal ? result[0].subTotal : 0,
                        totalCount: result.length
                    }
                    resolve(output); return 0;
                };

            } catch (error) {
                reject('Oops something went wrong');
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};
export const getAllCartProducts = (UID) => {
    return new Promise(async (resolve, reject) => {
        try {
            // validating inputs
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            try {

                const products = await getAllProductsWithTotalFormCart(userOutput.UID);
                resolve(products);

            } catch (error) {
                reject('Oops something went wrong');
            };
        } catch (error) {
            reject(error);
        };
    });
};
export const addUserAddress = (UID, address) => {
    return new Promise(async (resolve, reject) => {
        try {

            const addressOutput = await addressValidator(UID, address);

            try {
                // checks for existing data
                const existingData = await db.address.find({ UID: addressOutput.UID });

                let finalOutput;

                if (existingData.length == 0) finalOutput = await createAndAddAddress(addressOutput.UID, addressOutput);
                else finalOutput = await addToExistingAddress(addressOutput.UID, existingData, addressOutput);

                resolve(finalOutput);

            } catch (error) {
                reject(error);
            };

        } catch (error) {
            reject(error);
        };
    });
};
export const updateUserAddress = (UID, address) => {
    return new Promise(async (resolve, reject) => {
        try {

            const addressOutput = await addressValidator(UID, address);

            try {
                // checks for existing data
                const existingData = await db.address.find({ UID: addressOutput.UID });

                let finalData;

                if (existingData.length > 0) finalData = await updateAddress(UID, existingData, addressOutput);
                else finalData = await createAndAddAddress(UID, addressOutput);

                resolve(finalData);

            } catch (error) {
                reject(error);
            };
        } catch (error) {
            reject(error);
        };
    });
};