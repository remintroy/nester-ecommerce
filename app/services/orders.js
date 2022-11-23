import * as auth from './auth.js';
import * as products from './products.js';
import * as db from './schema.js';
import * as util from './util.js';
import * as cart from './cart.js';
import * as address from './address.js';
import * as razorpay from './razorpay.js';
import * as paypal from './paypal.js';
import * as analytics from './analytics.js';

const ORDERID_LENGTH = 20;
const ALL_ORDER_STATUS = ['ordered_OR', 'shipped_SH', 'out for delivery_OT', 'delivered_DD', 'cancelled_CC'];

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
//.. user
export const checkout = async (UID, body) => {
    try {
        const startTime = new Date();
        // HERE UID is considerd validated because its form session

        // getting data from request body
        const { method: paymentMethod = null, address: addressFrom = null } = body;

        // guard for check existance of all data
        if (addressFrom == null || paymentMethod == null) throw `Requset doesn't contain all needed data`;

        // guard for paymet methord
        if (['COD', 'razorpay', 'paypal'].indexOf(paymentMethod) == -1) throw 'Invalid payment methord';

        // --------- gets all products in cart ---------
        const products = await cart.getAllProductsWithTotal(UID);

        // check for emplty cart
        if (products?.length == 0) throw 'Nothing to checkout';

        // some analytics to each products
        products?.forEach(async product => {
            try {
                await analytics.addProductReachedCheckout(product.PID);
                await analytics.addProductInteractions(product.PID);
                await analytics.addProductImpressions(product.PID);
            } catch (error) {
                //..  
            };
        });

        for (const product of products) {
            if (product.quantity > product.stock) throw 'Some products in cart is out of stock';
        };

        // ---------- address ----------
        const addressResult = {};
        const addressOutput = await address.validator(UID, addressFrom);

        for (const i of Object.keys(addressOutput)) {
            if (addressOutput[i]) addressResult[i] = addressOutput[i];
        };

        let addressID = await address.save(UID, addressResult);
        addressID = addressID._id + "";

        // -------- set values to products -------
        products?.map(e => e['paymentStatus'] = 'pending');
        products?.map(e => e['status'] = 'ordered');
        products?.map(e => e['update'] = new Date());
        products?.map(e => e.statusUpdate = {
            0: { status: 'ordered', date: new Date() }
        });

        // --------- getting data's -------------
        let existingOrdresCollection = null;
        let userData = null;

        try {
            existingOrdresCollection = await db.orders.find({ UID: UID });
            userData = await db.users.find({ UID: UID }, {
                _id: 0,
                password: 0,
                loginProvider: 0,
                __v: 0,
                blocked: 0,
                lastLogin: 0,
                creationTime: 0,
                UID: 0
            });
        } catch (error) {
            throw 'Error while fetching user data';
        };

        // --------- Creating order -----------
        const orderTotalAmount = products[0].subTotal;
        const orderID = await createOrderID();

        try {

            const dataToDatabase = {
                orderID: orderID,
                products: products,
                address: addressResult,
                paymentType: paymentMethod,
                status: 'ordered',
                paymentStatus: 'pending'
            };

            // if user has a orders collection
            if (existingOrdresCollection.length > 0) {
                // updating existing document
                const data = await db.orders.updateOne({ UID: UID }, {
                    $push: {
                        orders: [dataToDatabase]
                    }
                });
            } else {
                // creating new document
                const data = await db.orders({
                    UID: UID,
                    orders: [dataToDatabase]
                });
                const confirm = await data.save();
            };
        } catch (error) {
            throw 'Error while creating order';
        };

        // --------- creating order in specified paymetn method --------

        let paymentDetails = {};
        let collectedErrors;

        if (paymentMethod == 'razorpay') {
            try {
                // creating order in razorpay
                paymentDetails = await razorpay.createOrder(UID, orderID, orderTotalAmount);
            } catch (error) {
                throw error?.error?.description ? error?.error?.description : 'Payment gateway error';
            };
        } else if (paymentMethod == 'paypal') {
            try {
                // creating order in paypal
                paymentDetails = await paypal.createOrder(UID, orderID, orderTotalAmount);
            } catch (error) {
                throw (error?.error?.description ? error?.error?.description : 'Payment gateway error');
            };
        } else {
            paymentDetails = {
                orderID: orderID
            };
        };

        if (paymentMethod == 'COD') {
            try {
                for (const product of products) {
                    await db.products.updateOne({ PID: product.PID }, {
                        $inc: {
                            stock: 0 - Number(product.quantity)
                        }
                    });
                };
                const cartDataRemoveStatus = await db.cart.updateOne({ UID: UID }, {
                    $set: {
                        products: []
                    }
                });
            } catch (error) {
                collectedErrors = 'Error while removing product from cart';
            };
        };

        return {
            id: paymentDetails?.id ? paymentDetails.id : orderID,
            timeTaken: new Date() - startTime + ' ms',
            orderID: orderID,
            amount: orderTotalAmount,
            typeOfPayment: paymentMethod,
            user: userData,
            status: 'created',
            message: 'Order successfully initiated',
            errors: collectedErrors
        };

    } catch (error) {
        throw error;
    };
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
export const paymentConfirmPaypal = async (UID, id, orderID) => {
    try {
        const result = await paypal.capturePayment(id);
        if (result.status == 'COMPLETED') {
            try {
                const dataFromDb = await db.orders.find({ UID: UID });
                if (dataFromDb[0]) {


                    const indexOfOrder = dataFromDb[0].orders.map(e => e.orderID == orderID).indexOf(true);
                    const updatedData = await db.orders.updateOne({ UID: UID }, {
                        $set: {
                            [`orders.${indexOfOrder}.paymentStatus`]: 'paid'
                        }
                    });

                    const productData = await cart.getAllProductsWithTotal(UID);
                    for (const product of productData) {
                        await db.products.updateOne({ PID: product.PID }, {
                            $inc: {
                                stock: 0 - Number(product.quantity)
                            }
                        });
                        try {
                            await analytics.addProductImpressions(product.PID);
                        } catch (error) {
                            //...
                        };
                    };

                    const cartDataRemoveStatus = await db.cart.updateOne({ UID: UID }, {
                        $set: {
                            products: []
                        }
                    });
                    // 
                    return 'Payment success';
                } else {
                    throw 'Order not found';
                };
            } catch (error) {
                throw 'Error syncing payment details, IF you are paid please contact our customer support';
            };
        };
    } catch (error) {
        throw error;
    };
};
export const paymentConfirmRazorpay = async (UID, body) => {
    try {
        // valdiating userID
        const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
        // validating payment signature
        const validatePayment = razorpay.verifyPurchace(body.keys.paymentID, body.keys.id, body.keys.signature);
        if (!validatePayment) throw 'Error validating payment';

        try {
            const dataFromDb = await db.orders.find({ UID: userOutput.UID });
            if (dataFromDb[0]) {

                const indexOfOrder = dataFromDb[0].orders.map(e => e.orderID == body.keys.orderID).indexOf(true);
                const updatedData = await db.orders.updateOne({ UID: userOutput.UID }, {
                    $set: {
                        [`orders.${indexOfOrder}.paymentStatus`]: 'paid'
                    }
                });
                const productData = await cart.getAllProductsWithTotal(UID);
                for (const product of productData) {
                    await db.products.updateOne({ PID: product.PID }, {
                        $inc: {
                            stock: 0 - Number(product.quantity)
                        }
                    });
                    try {
                        await analytics.addProductImpressions(product.PID);
                    } catch (error) {
                        //...
                    };
                };
                const cartDataRemoveStatus = await db.cart.updateOne({ UID: userOutput.UID }, {
                    $set: {
                        products: []
                    }
                });
                // 
                return 'Payment success';
            } else {
                throw 'Order not found';
            };
        } catch (error) {
            throw 'Error syncing payment details, IF you are paid please contact our customer support';
        };

    } catch (error) {
        throw error;
    };
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

                    let statusIndex = ALL_ORDER_STATUS.map(e => e.split('_')[0] == existingData[0]?.orders[indexOrder]?.products[indexProduct].status).indexOf(true);

                    try {

                        if (statusIndex == ALL_ORDER_STATUS.length - 1) throw `Can't update status of cancelled order`;
                        if (statusIndex == ALL_ORDER_STATUS.length - 2) throw `Can't update status of delevered order`;

                        if (status == 'next') {
                            if (statusIndex >= ALL_ORDER_STATUS.length - 2) throw ('Nothing to update');
                            else if (statusIndex != -1) statusIndex = statusIndex + 1;
                            else statusIndex = 0;
                        }
                        else if (status == 'cancel') statusIndex = ALL_ORDER_STATUS.length - 1;

                    } catch (error) {
                        reject(error); return 0;
                    };

                    if (indexOrder == -1) reject('Order not found');
                    else if (indexProduct == -1) reject("Order not found");
                    else {

                        if (status != 'next' && status != 'cancel') reject('Invalid status');
                        else {
                            const updated = await db.orders.updateOne({ 'orders.orderID': orderID }, {
                                $set: {
                                    [`orders.${indexOrder}.products.${indexProduct}.statusUpdate.${statusIndex + ""}`]: {
                                        status: ALL_ORDER_STATUS[statusIndex]?.split('_')[0],
                                        date: new Date(),
                                    },
                                    [`orders.${indexOrder}.products.${indexProduct}.status`]: ALL_ORDER_STATUS[statusIndex]?.split('_')[0],
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
