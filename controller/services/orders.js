import * as auth from './auth.js';
import * as products from './products.js';
import * as db from './schema.js';
import * as util from './util.js';
import * as cart from './cart.js';
import * as address from './address.js';
import * as razorpay from './razorpay.js';
import * as paypal from './paypal.js';
import * as analytics from './analytics.js';
import * as wallets from './wallet.js';
import * as coupon from './coupens.js';

const ORDERID_LENGTH = 20;
const ALL_ORDER_STATUS = ['ordered_OR', 'shipped_SH', 'out for delivery_OT', 'delivered_DD', 'returned_RD', 'cancelled_CC'];

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
        if (['COD', 'razorpay', 'paypal', 'wallet'].indexOf(paymentMethod?.toLowerCase()) == -1) throw 'Invalid payment methord';

        // TODO : check for availabe cart products

        // --------- gets all products in cart --------- // Coupen ----
        const products = body?.coupon ? await coupon.check(UID, body?.coupon) : await cart.getAllProductsWithTotal(UID);

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
                status: 'pending',
                paymentStatus: 'pending'
            };

            if (body?.coupon) dataToDatabase['couponCode'] = body?.coupon?.trim();
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

        // --------- creating order in specified payment method --------

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

        // paying using wallet money
        if (paymentMethod == 'Wallet') {
            try {

                // fetching informatin from wallet
                const walletInfo = await wallets.getWalletInfo(UID);

                // check if wallet contans nessory amount
                if (walletInfo.amount < orderTotalAmount) throw `Wallet dosen't have enough money`;

                // ------------------------- wallet -----------------------
                try {

                    // fetching all orderes data form db to find index to update
                    const existingDataFrmDb = await db.orders.findOne({ UID: UID });

                    // index of order
                    const indexOfOrder = existingDataFrmDb.orders.map(e => e.orderID == orderID).indexOf(true);

                    // updateing order status 
                    const updatedDataToDb = await db.orders.updateOne({ UID: UID }, {
                        $set: {
                            [`orders.${indexOfOrder}.status`]: 'ordered',
                            [`orders.${indexOfOrder}.paymentStatus`]: 'paid'
                        }
                    });

                    // decreasing amount from wallet
                    const removedAmountData = await wallets.removeAmount(UID, orderTotalAmount, 'Product purchase');

                    // updating product stocks
                    for (const product of products) {
                        await db.products.updateOne({ PID: product.PID }, {
                            $inc: {
                                stock: 0 - Number(product.quantity)
                            }
                        });
                    };

                    // clearing cart
                    const cartDataRemoveStatus = await db.cart.updateOne({ UID: UID }, {
                        $set: {
                            products: []
                        }
                    });

                    // if coupen used update usage of coupen
                    if (body?.coupon) {
                        const updateCouponUsage = await db.coupens.updateOne({ code: body?.coupon }, {
                            $inc: {
                                used: 1
                            }
                        });
                    };

                } catch (error) {
                    // handling error
                    throw 'Failed to create order please try after sometime';
                };

            } catch (error) {
                // handling error 
                throw error;
            };
        };

        if (paymentMethod == 'COD') {
            try {

                // fetching all orderes data form db to find index to update
                const existingDataFrmDb = await db.orders.findOne({ UID: UID });

                // index of order
                const indexOfOrder = existingDataFrmDb.orders.map(e => e.orderID == orderID).indexOf(true);

                // updateing order status 
                const updatedDataToDb = await db.orders.updateOne({ UID: UID }, {
                    $set: {
                        [`orders.${indexOfOrder}.status`]: 'ordered'
                    }
                });

                // updating product stocks
                for (const product of products) {
                    await db.products.updateOne({ PID: product.PID }, {
                        $inc: {
                            stock: 0 - Number(product.quantity)
                        }
                    });
                };

                // clearing cart
                const cartDataRemoveStatus = await db.cart.updateOne({ UID: UID }, {
                    $set: {
                        products: []
                    }
                });

                // if coupen used update usage of coupen
                if (body?.coupon) {
                    const updateCouponUsage = await db.coupens.updateOne({ code: body?.coupon }, {
                        $inc: {
                            used: 1
                        }
                    });
                };

                //...
            } catch (error) {
                throw 'Faild to create order please try after sometime';
            };
        };

        return {
            id: paymentDetails?.id ? paymentDetails.id : orderID,
            timeTaken: new Date() - startTime + ' ms',
            orderID: orderID,
            amount: orderTotalAmount,
            typeOfPayment: paymentMethod,
            user: userData[0],
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

                    if (existingData[0].orders[indexOrder].products[indexProduct].statusUpdate['3'].date) {
                        throw 'Cant cancel deleverd order';
                    }

                    else {

                        const updated = await db.orders.updateOne({ UID: userOutput.UID }, {
                            $set: {
                                [`orders.${indexOrder}.products.${indexProduct}.status`]: 'cancelled',
                                [`orders.${indexOrder}.products.${indexProduct}.update`]: new Date(),
                                [`orders.${indexOrder}.products.${indexProduct}.statusUpdate.5`]: {
                                    status: 'cancelled',
                                    date: new Date()
                                }
                            }
                        });

                        if (existingData[0].orders[indexOrder].paymentStatus == 'paid') {

                            // refund
                            const amountToAdd = existingData[0].orders[indexOrder].products[indexProduct].total;
                            const addAmountToWallet = await wallets.addAmount(existingData[0].UID, amountToAdd, 'Refund due to order cancelation');
                        };

                        // re updating the stock
                        const stockToUpdate = existingData[0].orders[indexOrder].products[indexProduct].quantity;
                        const updateStock = await db.products.updateOne({ PID: productOutput.PID }, {
                            $inc: {
                                stock: stockToUpdate
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
export const returnOrderByUID = async (UID, orderID, PID) => {
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
                                [`orders.${indexOrder}.products.${indexProduct}.status`]: 'return-requested',
                                [`orders.${indexOrder}.products.${indexProduct}.update`]: new Date(),
                                [`orders.${indexOrder}.products.${indexProduct}.statusUpdate.4`]: {
                                    status: 'returnReq',
                                    date: new Date()
                                }
                            }
                        });

                        // refund
                        if (false) {
                            const amountToAdd = existingData[0].orders[indexOrder].products[indexProduct].total;
                            const addAmountToWallet = await wallets.addAmount(existingData[0].UID, amountToAdd, 'Refund due to order return');

                            // updating the stock
                            const stockToUpdate = existingData[0].orders[indexOrder].products[indexProduct].quantity;
                            const updateStock = await db.products.updateOne({ PID: productOutput.PID }, {
                                $inc: {
                                    stock: stockToUpdate
                                }
                            });
                        };

                        resolve("Succssfully requestsed for return");
                    };

                } else {
                    reject('Nothing to return');
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

                    if (dataFromDb[0].orders[indexOfOrder].couponCode) {
                        const updateCouponUsage = await db.coupens.updateOne({ code: dataFromDb[0].orders[indexOfOrder].couponCode }, {
                            $inc: {
                                used: 1
                            }
                        });
                    };
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

                if (dataFromDb[0].orders[indexOfOrder].couponCode) {
                    const updateCouponUsage = await db.coupens.updateOne({ code: dataFromDb[0].orders[indexOfOrder].couponCode }, {
                        $inc: {
                            used: 1
                        }
                    });
                };
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
export const getAll = async (page) => {
    try {
        // validating request values
        if (isNaN(Number(page)) && page) throw ('Invalid query parameters');

        page = Number(page) > 0 ? page : 1;
        page = Number(page) ? page : 1;

        const listLenght = 10;
        const outputData = {};

        outputData.length = listLenght;

        let countFromDb;

        try {
            countFromDb = await db.orders.aggregate([{ $unwind: '$orders' }, { $group: { _id: 'totalLenght', sum: { $sum: 1 } } }]);
        } catch (error) {
            throw 'Error while fetching data from db';
        };

        outputData.totalCount = countFromDb[0].sum;

        const maxPG = parseInt(outputData.totalCount / listLenght) + (outputData.totalCount % listLenght != 0 ? 1 : 0);

        if (Number(page) > maxPG) throw 'No orders data available';


        const data = await db.orders.aggregate([
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
                $addFields: {
                    maxPage: maxPG,
                    currentPage: page,
                }
            },
            {
                $sort: {
                    'orders.dateOFOrder': -1
                }
            },
            { $skip: ((page - 1) * listLenght) },
            { $limit: listLenght },
            {
                $project: {
                    _id: 0,
                }
            }
        ]);

        //resolving data
        return (data);

    } catch (error) {
        //handling error
        throw (error);
    };
};
export const getAllWithFromattedDate = (page) => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await getAll(page);
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

// export const cancelOrder = (orderID) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const existingData = await db.orders.find({ "orders._id": orderID });
//             const index = existingData[0].orders.map(e => e._id == orderID).indexOf(true);

//             const updated = await db.orders.updateOne({ "orders._id": orderID }, {
//                 $set: {
//                     [`orders.${index}.status`]: 'cancelled',
//                     [`orders.${index}.update`]: new Date()
//                 }
//             });
//             resolve("order successfully cancelled");
//         } catch (error) {
//             reject("Error cancelling order");
//         };
//     });
// };
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
                },
                {
                    $project: {
                        'order.products.impressions': 0,
                        'order.products.views': 0,
                        'order.products.reachedCheckout': 0,
                        'order.products.interactions': 0,
                        'order.products.productsListingViews:': 0,
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
                        if (statusIndex == ALL_ORDER_STATUS.length - 3) throw `Can't update status of delevered order`;
                        if (statusIndex == ALL_ORDER_STATUS.length - 2) throw `Can't update status of returned order`;

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

                        if (status != 'next' && status != 'cancel' && status != 'approve') reject('Invalid status');
                        else {

                            if (status == 'approve') {
                                statusIndex = 4;
                            }

                            // data to update
                            let dataToSave = {
                                [`orders.${indexOrder}.products.${indexProduct}.status`]: ALL_ORDER_STATUS[statusIndex]?.split('_')[0],
                                [`orders.${indexOrder}.products.${indexProduct}.update`]: new Date()
                            };

                            if (status == 'approve') {
                                dataToSave[`orders.${indexOrder}.products.${indexProduct}.statusUpdate.4`] = {
                                    status: ALL_ORDER_STATUS[4]?.split('_')[0],
                                    date: new Date()
                                };

                                // creating refund
                                const amountToAdd = existingData[0].orders[indexOrder].products[indexProduct].total;
                                const addAmountToWallet = await wallets.addAmount(existingData[0].UID, amountToAdd, 'Refund due to order return');

                                // TODO: dose the code in if below needed
                                if (false) {
                                    // updating the stock
                                    const stockToUpdate = existingData[0].orders[indexOrder].products[indexProduct].quantity;
                                    const updateStock = await db.products.updateOne({ PID: productOutput.PID }, {
                                        $inc: {
                                            stock: stockToUpdate
                                        }
                                    });
                                };

                            } else {
                                dataToSave[`orders.${indexOrder}.products.${indexProduct}.statusUpdate.${statusIndex + ""}`] = {
                                    status: ALL_ORDER_STATUS[statusIndex]?.split('_')[0],
                                    date: new Date(),
                                };
                            };

                            // updating data from db
                            const updated = await db.orders.updateOne({ 'orders.orderID': orderID }, {
                                $set: dataToSave
                            });

                            if (ALL_ORDER_STATUS[statusIndex] == ALL_ORDER_STATUS[ALL_ORDER_STATUS.length - 1]) {
                                if (existingData[0].orders[indexOrder].paymentStatus == 'paid') {
                                    const amountToAdd = existingData[0].orders[indexOrder].products[indexProduct].total;
                                    const addAmountToWallet = await wallets.addAmount(existingData[0].UID, amountToAdd, 'Refund due to order cancelation');
                                };
                                const updateStock = await db.products.updateOne({ PID: productOutput.PID }, {
                                    $inc: {
                                        stock: existingData[0].orders[indexOrder].products[indexProduct].quantity
                                    }
                                });
                            };
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
        const data = await getByOrderID('KKVgdVASsZ5p7_jpCYqQ');

        // data.map(e=>e['status']='pending');

        console.log('Result => ', data[0].order);
    } catch (error) {
        console.log('TEST Err => ', error);
    };
};
// test();
