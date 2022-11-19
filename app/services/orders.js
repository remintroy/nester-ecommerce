import * as auth from './auth.js';
import * as products from './products.js';
import * as db from './schema.js';
import * as util from './util.js';
import * as cart from './cart.js';
import * as address from './address.js';
import * as razorpay from './razorpay.js';
import * as paypal from './paypal.js';

const ORDERID_LENGTH = 20;
const ALL_ORDER_STATUS = ['orderd', 'packed', 'arriving today', 'out for delivery', 'delivered', 'cancelled'];

const createOrderID = async () => {
    let orderID = '';

    // check for the duplication of orderID
    async function checkForExistance() {
        const data = await db.orders.find({ 'orders.orderID': orderID });
        if (data.length > 0) return true;
        return false;
    };

    //...
    do {
        orderID = util.randomId(ORDERID_LENGTH);
    } while (await checkForExistance());

    // result orderID
    return orderID;
};
const addTODB = (UID, addressFrom, type, save) => {

    save = 'YES';

    return new Promise(async (resolve, reject) => {
        try {
            // get all products from cart
            const products = await cart.getAllProductsWithTotal(UID);

            // check for products existence
            if (products.length == 0) throw 'Nothing to checkout';
            // sets evey product status
            products?.map(e => e['paymentStatus'] = 'pending');
            products?.map(e => e['status'] = 'orderd');
            products?.map(e => e['update'] = new Date());

            try {
                // 
                const checkForExistingCollection = await db.orders.find({ UID: UID });
                const userDataForCheckout = await db.users.find({ UID: UID }, {
                    _id: 0,
                    password: 0,
                    loginProvider: 0,
                    __v: 0,
                    blocked: 0,
                    lastLogin: 0,
                    creationTime: 0,
                    UID: 0
                });

                let paymentDetails = {};
                let addressDetails = {};

                // cheks and saves address accordingly
                if (save == "YES") {
                    try {
                        const saveAddress = await address.save(UID, addressFrom);
                        addressDetails.id = saveAddress._id + "";
                    } catch (error) {
                        reject(error); return 0;
                    };
                };

                //... PAYMENT
                if (type == 'online') {
                    try {
                        // total amount to pay
                        const orderTotalAmount = products[0].subTotal;
                        // creating order in razorpay
                        paymentDetails = await razorpay.createOrder(UID, await createOrderID(), orderTotalAmount);

                    } catch (error) {
                        reject(error?.error?.description ? error?.error?.description : 'Error Creating order');
                    };
                } else if (type == 'paypal') {
                    try {
                        // total amount to pay
                        const orderTotalAmount = products[0].subTotal;
                        // creating order in razorpay
                        paymentDetails = await paypal.createOrder(UID, await createOrderID(), orderTotalAmount);
                    } catch (error) {
                        reject(error?.error?.description ? error?.error?.description : 'Error Creating order');
                    };

                } else if (type == 'COD') {
                    // place order and save to db

                    paymentDetails = {
                        type: 'COD',
                        orderID: await createOrderID()
                    };

                    //...
                    if (checkForExistingCollection.length > 0) {
                        // order collection exists for this user
                        const data = await db.orders.updateOne({ UID: UID }, {
                            $push: {
                                orders: [
                                    {
                                        orderID: paymentDetails?.receipt ? paymentDetails.receipt?.split('_')[1] : paymentDetails.orderID,
                                        paymentDetails: paymentDetails,
                                        products: products,
                                        address: addressFrom,
                                        paymentType: type,
                                        status: 'pending',
                                        paymentStatus: 'pending'
                                    }
                                ]
                            }
                        });
                        products?.forEach(async (product) => {
                            const updates = await db.products.updateOne({ PID: product.PID }, {
                                $inc: {
                                    interactions: 1,
                                    purchased: 1,
                                },
                                $set: {
                                    lastPurchased: new Date()
                                }
                            });
                        });
                    } else {
                        // order collection not exists for this user
                        const data = await db.orders({
                            UID: UID,
                            orders: [
                                {
                                    orderID: paymentDetails?.receipt ? paymentDetails.receipt?.split('_')[1] : paymentDetails.orderID,
                                    paymentDetails: paymentDetails,
                                    products: products,
                                    address: addressFrom,
                                    paymentType: type,
                                    status: 'pending',
                                    paymentStatus: 'pending'
                                }
                            ]
                        });
                        const confirm = await data.save();
                        
                        products?.forEach(async (product) => {
                            const updates = await db.products.updateOne({ PID: product.PID }, {
                                $inc: {
                                    interactions: 1,
                                    purchased: 1,
                                },
                                $set: {
                                    lastPurchased: new Date()
                                }
                            });
                        });
                    };

                    // clear cart
                    const cartDataRemoveStatus = await db.cart.updateOne({ UID: UID }, {
                        $set: {
                            products: []
                        }
                    });
                    products?.forEach(async (product) => {
                        const updates = await db.products.updateOne({ PID: product.PID }, {
                            $inc: {
                                interactions: 1,
                                addedToCart: -1
                            }
                        });
                    });

                    resolve({
                        id: paymentDetails.orderID,
                        amount: products[0].subTotal,
                        user: userDataForCheckout[0],
                        status: 'created',
                        message: 'Order successfully rejested'
                    });
                };

                if (type == 'online' || type == 'paypal') resolve({
                    address: addressDetails,
                    id: paymentDetails.id,
                    amount: paymentDetails.amount,
                    receipt: paymentDetails.receipt,
                    status: paymentDetails.status,
                    user: userDataForCheckout[0],
                    message: 'Order successfully initiated'
                });

                //...

            } catch (error) {
                console.log("Error => ", error);
                reject('Error initiating address');
            };
        } catch (error) {
            reject(error);
        };
    });
};
const addTODBOnline = (UID, addressFrom) => {
    return new Promise(async (resolve, reject) => {
        try {
            // get all products from cart
            const products = await cart.getAllProductsWithTotal(UID);
            // check for products existence
            if (products.length == 0) throw 'Nothing to checkout';
            // sets evey product status
            products?.map(e => e['paymentStatus'] = 'paid');
            products?.map(e => e['status'] = 'orderd');
            products?.map(e => e['update'] = new Date());

            try {
                // 
                const checkForExistingCollection = await db.orders.find({ UID: UID });
                const userDataForCheckout = await db.users.find({ UID: UID }, {
                    _id: 0,
                    password: 0,
                    loginProvider: 0,
                    __v: 0,
                    blocked: 0,
                    lastLogin: 0,
                    creationTime: 0,
                    UID: 0
                });

                // place order and save to db
                let paymentDetails = {
                    type: 'online',
                    orderID: await createOrderID(),
                    amount: products[0].subTotal
                };

                //...
                if (checkForExistingCollection.length > 0) {
                    // order collection exists for this user
                    const data = await db.orders.updateOne({ UID: UID }, {
                        $push: {
                            orders: [
                                {
                                    orderID: paymentDetails?.orderID ? paymentDetails.orderID : await createOrderID(),
                                    paymentDetails: paymentDetails,
                                    products: products,
                                    address: addressFrom,
                                    paymentType: 'online',
                                    paymentStatus: 'paid'
                                }
                            ]
                        }
                    });
                    products?.forEach(async (product) => {
                        const updates = await db.products.updateOne({ PID: product.PID }, {
                            $inc: {
                                interactions: 1,
                                purchased: 1,
                            },
                            $set: {
                                lastPurchased: new Date()
                            }
                        });
                    });
                } else {
                    // order collection not exists for this user
                    const data = await db.orders({
                        UID: UID,
                        orders: [
                            {
                                orderID: paymentDetails?.orderID ? paymentDetails.orderID : await createOrderID(),
                                paymentDetails: paymentDetails,
                                products: products,
                                address: addressFrom,
                                paymentType: 'online',
                                paymentStatus: 'paid'
                            }
                        ]
                    });
                    data.save();
                    products?.forEach(async (product) => {
                        const updates = await db.products.updateOne({ PID: product.PID }, {
                            $inc: {
                                interactions: 1,
                                purchased: 1,
                            },
                            $set: {
                                lastPurchased: new Date()
                            }
                        });
                    });
                };

                // clear cart
                const cartDataRemoveStatus = await db.cart.updateOne({ UID: UID }, {
                    $set: {
                        products: []
                    }
                });
                products?.forEach(async (product) => {
                    const updates = await db.products.updateOne({ PID: product.PID }, {
                        $inc: {
                            interactions: 1,
                            addedToCart: -1
                        }
                    });
                });

                resolve({
                    amount: products[0].subTotal,
                    status: 'paid',
                    user: userDataForCheckout[0],
                    message: 'Order successfully initiated'
                });

                //...
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

            if (body?.method == 'COD' || body?.method == 'online' || body?.method == 'paypal') method = body?.method;
            else throw 'Payment methord required';

            try {

                // updating data of carted products
                const products = await cart.getAllProductsWithTotal(userOutput.UID);
                products?.forEach(async (product) => {
                    const updates = await db.products.updateOne({ PID: product.PID }, {
                        $inc: {
                            interactions: 1,
                            reachedCheckout: 1
                        }
                    });
                });

                // if place order by existing address
                if (body?.type == 'id') {
                    // find address form db
                    try {
                        const address = await db.address.findOne({ UID: userOutput.UID });
                        let output = {};

                        // matching address
                        address?.address?.forEach(e => {
                            if (e._id == body.address) {
                                output = e;
                            };
                        });

                        if (address) {
                            try {
                                // place order
                                const data = await addTODB(userOutput.UID, output, method);
                                resolve(data);

                            } catch (error) {
                                reject(error);
                            };
                        } else {
                            reject("Plz select address");
                        };

                    } catch (error) {
                        console(error)
                        reject('Error fetching address form db');
                    };

                } else {
                    // place order by new address
                    const data = await addTODB(userOutput.UID, body.address, method, body?.address?.save ? 'YES' : 'NO');
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
export const cancelOrderWithUID = (UID, orderID) => {
    return new Promise(async (resolve, reject) => {
        try {
            // valdiating user id ;
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });

            try {

                // order data to find index and check for existence
                const existingData = await db.orders.find({ UID: userOutput.UID });

                if (existingData.length > 0) {

                    const index = existingData[0].orders.map(e => e._id == (orderID + "").trim()).indexOf(true);

                    if (index == -1) reject("Order not found");
                    else {

                        const updated = await db.orders.updateOne({ UID: userOutput.UID }, {
                            $set: {
                                [`orders.${index}.status`]: 'cancelled',
                                [`orders.${index}.update`]: new Date()
                            }
                        })

                        resolve("Order successfully cancelled");

                    };

                } else {
                    reject('Nothing to cancel');
                };

                //...
            } catch (error) {
                console.log('error => ', error);
                reject('Error cancelling order');
            };
            //...
        } catch (error) {
            reject(error);
        };
    });
};
export const cancelOrderProductWithUID = (UID, orderID, PID) => {
    return new Promise(async (resolve, reject) => {
        try {
            // valdiating user id ;
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            const productOutput = await products.validatior({ PID: PID }, { PID: true }, 'updateproduct');
            try {

                // order data to find index and check for existence
                const existingData = await db.orders.find({ UID: userOutput.UID });

                if (existingData.length > 0) {

                    const indexOrder = existingData[0].orders.map(e => e._id == (orderID + "").trim()).indexOf(true);
                    const indexProduct = existingData[0].orders[indexOrder].products.map(e => e.PID == (productOutput.PID + "").trim()).indexOf(true);

                    if (indexProduct == -1) reject("Order not found");
                    else {

                        const updated = await db.orders.updateOne({ UID: userOutput.UID }, {
                            $set: {
                                [`orders.${indexOrder}.products.${indexProduct}.status`]: 'cancelled',
                                [`orders.${indexOrder}.products.${indexProduct}.update`]: new Date()
                            }
                        });

                        const updateStat = await db.products.updateOne({ PID: productOutput }, {
                            $inc: {
                                cancelled: 1
                            }
                        });

                        resolve("Order successfully cancelled");
                    };

                } else {
                    reject('Nothing to cancel');
                };

                //...
            } catch (error) {
                console.log('error => ', error);
                reject('Error cancelling order');
            };
            //...
        } catch (error) {
            reject(error);
        };
    });
};
// paypal payment
export const paymentConfirmPaypal = (UID, id, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await paypal.capturePayment(id);
            resolve(result);
        } catch (error) {
            reject(error);
        };
    });
};
export const paymentConfirmRazorpay = (UID, body) => {
    return new Promise(async (resolve, reject) => {
        try {
            // valdiating userID
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            // validating payment signature
            const validatePayment = razorpay.verifyPurchace(body.keys.paymentID, body.keys.orderID, body.keys.signature);
            if (!validatePayment) throw 'Error validating payment';

            // find address form db
            try {
                const address = await db.address.findOne({ UID: userOutput.UID });
                let output = {};

                // matching address
                address?.address?.forEach(e => {
                    if (e._id == body?.address?.id ? body.address.id : body?.address) {
                        output = e;
                    };
                });

                if (address) {
                    try {
                        // place order
                        const data = await addTODBOnline(userOutput.UID, output);
                        resolve(data);

                    } catch (error) {
                        reject(error);
                    };
                } else {
                    reject("Plz select address");
                };

            } catch (error) {
                console(error)
                reject('Error fetching address form db');
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
                    $lookup: {
                        localField: 'UID',
                        foreignField: 'UID',
                        from: 'users',
                        as: "user"
                    }
                },
                {
                    $sort: {
                        'orders.dateOFOrder': -1
                    }
                },
                {
                    $project: {
                        _id: 0,
                    }
                }
            ]);
            resolve(data);
        } catch (error) {
            reject(error);
        };
    });
};
export const getAllWithFromattedDate = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await getAll();
            const result = [];
            data.forEach((e, i, a) => {
                const output = {};
                const keys = Object.keys(e);
                keys.forEach((k, j, array) => {
                    output[k] = e[k];
                    if (k == 'orders') output[k].dateOFOrder = util.dataToReadable(e[keys[j]].dateOFOrder);
                    if (k == 'user' && output[k][0]) output[k][0].creationTime = util.dataToReadable(e[keys[j]][0]?.creationTime);
                    if (k == 'user' && output[k][0]) output[k][0].lastLogin = util.dataToReadable(e[keys[j]][0].lastLogin);
                    if (k == 'orders') output[k].products.forEach((ee, ii, aa) => {
                        output[keys[j]].products[ii].creationTime = util.dataToReadable(e[keys[j]].products[ii].creationTime);
                        output[keys[j]].products[ii].updated = util.dataToReadable(e[keys[j]].products[ii].updated);
                    });
                });
                result.push(output);
            });
            resolve(data);
        } catch (error) {
            reject(error);
        }
    });
};

export const cancelOrder = (orderID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const existingData = await db.orders.find({ "orders._id": orderID });
            const index = existingData[0].orders.map(e => e._id == orderID).indexOf(true);

            const updated = await db.orders.updateOne({ "orders._id": orderID }, {
                $set: {
                    [`orders.${index}.status`]: 'cancelled',
                    [`orders.${index}.update`]: new Date()
                }
            });
            resolve("order successfully cancelled");
        } catch (error) {
            reject("Error cancelling order");
        };
    });
};
export const getByUID = (UID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            try {
                const orderData = await db.orders.aggregate([
                    {
                        $match: {
                            UID: userOutput.UID
                        }
                    },
                    {
                        $unwind: '$orders'
                    },
                    {
                        $sort: {
                            'orders.dateOFOrder': -1
                        }
                    }
                ]);
                resolve(orderData);
            } catch (error) {
                reject("Error fetching order data from db");
            };
        } catch (error) {
            reject(error);
        };
    });
};
export const getByUIDEach = (UID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            try {
                const orderData = await db.orders.aggregate([
                    {
                        $match: {
                            UID: userOutput.UID
                        }
                    },
                    {
                        $unwind: '$orders'
                    }
                    ,
                    {
                        $unwind: '$orders.products'
                    },
                    {
                        $sort: {
                            'orders.dateOFOrder': -1
                        }
                    }
                ]);
                resolve(orderData);
            } catch (error) {
                reject("Error fetching order data from db");
            };
        } catch (error) {
            reject(error);
        };
    });
};
export const getByOrderID = (orderID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const orderData = await db.orders.aggregate([
                {
                    $match: {
                        'orders.orderID': orderID
                    }
                },
                {
                    $unwind: '$orders'
                },
                {
                    $match: {
                        'orders.orderID': orderID
                    }
                },
                {
                    $lookup: {
                        localField: 'UID',
                        foreignField: 'UID',
                        from: 'users',
                        as: "user"
                    }
                },
                {
                    $unwind: '$orders.products'
                },
                {
                    $project: {
                        _id: 0,
                        UID: '$UID',
                        order: '$orders',
                        user: {
                            $arrayElemAt: ['$user', 0]
                        }
                    }
                }
            ]);
            resolve(orderData);
        } catch (error) {
            console.log(error);
            reject("Error fetching order data from db");
        };
    });
};
export const updateOrderStatus = (PID, orderID, status) => {
    return new Promise(async (resolve, reject) => {
        try {
            const productOutput = await products.validatior({ PID: PID }, { PID: true }, 'updateproduct');
            try {

                // order data to find index and check for existence
                const existingData = await db.orders.find({ 'orders.orderID': orderID });

                if (existingData.length > 0) {

                    const indexOrder = existingData[0].orders.map(e => e.orderID == (orderID + "").trim()).indexOf(true);
                    const indexProduct = existingData[0].orders[indexOrder].products.map(e => e.PID == (productOutput.PID + "").trim()).indexOf(true);

                    if (indexOrder == -1) reject('Order not found');
                    else
                        if (indexProduct == -1) reject("Order not found");
                        else {

                            const statusChecker = ALL_ORDER_STATUS.indexOf((status + "").trim().toLowerCase());
                            if (statusChecker == -1) reject('Invalid status');
                            else {
                                const updated = await db.orders.updateOne({ 'orders.orderID': orderID }, {
                                    $set: {
                                        [`orders.${indexOrder}.products.${indexProduct}.status`]: ALL_ORDER_STATUS[statusChecker],
                                        [`orders.${indexOrder}.products.${indexProduct}.update`]: new Date()
                                    }
                                });
                                resolve("Order successfully updated");
                            };
                        };

                } else {
                    reject('Nothing to update');
                };

                //...
            } catch (error) {
                console.log('error => ', error);
                reject('Error updating order');
            };
            //...
        } catch (error) {
            reject(error);
        };
    })
};

const test = async () => {
    try {
        const data = await getByOrderID('WJWVC3QKbiKDdS3WeyYH');

        // data.map(e=>e['status']='pending');

        console.log('Result => ', data);
    } catch (error) {
        console.log('TEST Err => ', error);
    };
};
// test();