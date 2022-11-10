import * as auth from './auth.js';
import * as products from './products.js';
import * as db from './schema.js';
import * as util from './util.js';
import * as cart from './cart.js';
import * as address from './address.js';


const addTODB = (UID, address, type) => {
    return new Promise(async (resolve, reject) => {
        try {
            // get all products from cart
            const products = await cart.getAllProductsWithTotal(UID);

            // check for products existence
            if (products.length == 0) throw 'Nothing to checkout';

            try {
                // 
                const checkForExistingCollection = await db.orders.find({ UID: UID });

                if (checkForExistingCollection.length > 0) {
                    // order collection exists for this user

                    const data = await db.orders.updateOne({ UID: UID }, {
                        $push: {
                            orders: [
                                {
                                    products: products,
                                    address: address,
                                    paymentType: type,
                                    status: 'pending'
                                }
                            ]
                        }
                    });

                    const cartDataRemoveStatus = await db.cart.updateOne({ UID: UID }, {
                        $set: {
                            products: []
                        }
                    });

                    //...
                    resolve("Order successfully rejested");
                } else {
                    // order collection not exists for this user

                    const data = await db.orders({
                        UID: UID,
                        orders: [
                            {
                                products: products,
                                address: address,
                                paymentType: type,
                                status: 'pending'
                            }
                        ]
                    });

                    data.save();

                    const cartDataRemoveStatus = await db.cart.updateOne({ UID: UID }, {
                        $set: {
                            products: []
                        }
                    });

                    //...
                    resolve("Order successfully rejested");
                };

            } catch (error) {
                console.log("Error => ", error);
                reject('Error initiating address');
            };
        } catch (error) {
            reject(error);
        };
    });
};

//.. user
export const checkout = (UID, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            let method;

            if (body?.method == 'COD' || body?.method == 'online') method = body?.method;
            else throw 'Payment methord required';

            try {

                // if place order by existing address
                if (body?.type == 'id') {
                    // find address form db
                    try {
                        const address = await db.address.findOne({ UID: userOutput.UID });
                        let output = {};

                        // matching address
                        address.address.forEach(e => {
                            if (e._id == body.address) {
                                output = e;
                            };
                        });

                        try {

                            // place order
                            const data = await addTODB(userOutput.UID, output, method);
                            resolve(data);

                        } catch (error) {
                            reject(error);
                        };

                    } catch (error) {
                        reject('Error fetching address form db');
                    };

                } else {
                    // place order by new address

                    // validate address
                    const addressOutput = await validator(UID, body.address);

                    // place order
                    const data = await addTODB(userOutput.UID, addressOutput, method);
                    resolve(data);
                };

            } catch (error) {
                reject(error);
            };
        } catch (error) {
            reject(error);
        };
    });
};

//.. admin 
export const getAll = () => {
    return new Promise((resolve, reject) => {
        try {
            const data = db.orders.aggregate([
                {
                    $unwind: '$orders'
                },
                {
                    $unwind: '$orders.products'
                },
                {
                    $lookup: {
                        localField:'UID',
                        foreignField:'UID',
                        from:'users',
                        as:"user"
                    }
                },
                {
                    $sort: {
                        'orders.dateOFOrder': -1
                    }
                },
                {
                    $project: {
                        _id: 0
                    }
                }
            ]);
            resolve(data);
        } catch (error) {
            reject(error);
        };
    });
};






const test = async () => {
    try {
        const result = await getAll();
        console.log('TEST => ', result[0]);
    } catch (error) {
        console.log('TEST Err => ', error);
    };
};
test();