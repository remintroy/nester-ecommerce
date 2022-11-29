import * as products from './products.js';
import * as db from './schema.js';
import * as util from './util.js';
import * as cart from './cart.js';

const COUPEN_CODE_LENGTH = 10;

export const createCoupenCode = async () => {
    let orderID = '';

    // check for the duplication of orderID
    async function checkForExistance() {
        const data = await db.coupens.find({ 'code': orderID });
        if (data.length > 0) return true;
        return false;
    };

    //...
    do {
        orderID = util.randomId(COUPEN_CODE_LENGTH, 'A');
    } while (await checkForExistance());

    // result orderID
    return orderID;
};

export const validatior = async (couponData) => {
    try {
        // desturingn values
        const { title, expiry, value, minSpend, maxSpend, maxUsage, category } = couponData;

        // must values
        if (title.trim().lenght < 10) throw 'Invalid title';
        if (value.trim().lenght < 10) throw 'Invalid value';
        if (util.dateIsValid(new Date(expiry)) == false) throw 'Invalid Date';
        if (isNaN(Number(minSpend)) && minSpend || minSpend && Number(minSpend) < 1) throw 'Invalid min spend number';
        if (isNaN(Number(maxSpend)) && maxSpend || maxSpend && Number(maxSpend) < 1 || minSpend && maxSpend && Number(minSpend) + 5 > Number(maxSpend)) throw 'Invalid max spend number';
        if (isNaN(Number(maxUsage)) && maxUsage || maxUsage && Number(maxUsage) < 1) throw 'Invalid max usage number';
        try { await products.validatior({ category: category?.trim() }); } catch (error) { throw error };

        return {
            title: title ? title?.trim() : null,
            expiry: expiry ? expiry?.trim() : null,
            value: value ? value?.trim().split('_')[0] : null,
            valueType: value ? value?.trim().split('_')[1] : null,
            minSpend: minSpend ? minSpend?.trim() : null,
            maxSpend: maxSpend ? maxSpend?.trim() : null,
            maxUsage: maxUsage ? maxUsage?.trim() : null,
            category: category ? category?.trim() : null,
        };

    } catch (error) {
        throw error;
    };
};

export const add = async (body) => {
    try {

        const couponOutput = await validatior(body);

        const added = db.coupens({
            title: couponOutput.title,
            expiry: couponOutput.expiry,
            value: couponOutput.value,
            valueType: couponOutput.valueType,
            minSpend: couponOutput.minSpend,
            maxSpend: couponOutput.maxSpend,
            maxUsage: couponOutput.maxUsage,
            category: couponOutput.category,
            code: await createCoupenCode()
        });

        return await added.save();

    } catch (error) {
        throw error;
    };
};

export const check = async (UID, couponCode) => {
    try {
        const dataFromCart = await cart.getAllProductsWithTotal(UID);
        let couponData;

        try {
            couponData = await db.coupens.findOne({ code: couponCode });
        } catch (error) {
            throw 'Error fetching coupne data';
        };

        // coupon validate guards
        if (couponData) {

            if (new Date(couponData.expiry) < new Date()) throw 'Coupon Expired';
            if (couponData.minSpend && Number(dataFromCart[0].subTotal) < Number(couponData.minSpend)) throw `You need to spend at least ${couponData.minSpend} Rs to apply this coupon`;
            if (couponData.maxSpend && Number(dataFromCart[0].subTotal) > Number(couponData.maxSpend)) throw `You need to spend below ${couponData.maxSpend} Rs to apply this coupon`;
            if (couponData.used && Number(couponData.maxUsage) <= Number(couponData.used)) throw `Coupon exeeded maximum usage limit`;
            if (couponData.category) {
                const index = dataFromCart.map(product => product.category == couponData.category).indexOf(true);

                if (index != -1) {
                    for (let product of dataFromCart) {
                        if (product.category == couponData.category) {

                            if (couponData.valueType == 'R' && Math.floor(Number(product.total) / Number(product.quantity)) > Number(couponData.value)) {
                                // decrese total of single prduct;
                                product.total = Number(product.total) - Number(couponData.value);
                                product.coupenApplied = true;
                                // decreasign subtotal
                                for (const p of dataFromCart) {
                                    p.subTotal = Number(p.subTotal) - Number(couponData.value);
                                };
                                break;
                            } else if (couponData.valueType == 'R') {
                                throw ('This coupon is not applicabe for this prouduct. Product value is less than coupen value');
                            } else if (couponData.valueType == 'P') {
                                const amountToDecrese = parseFloat((Number(couponData.value) * Math.floor(Number(product.total) / Number(product.quantity))) / 100).toFixed(2);

                                product.total = Number(product.total) - amountToDecrese;
                                product.coupenApplied = true;
                                // decreasign subtotal
                                for (const p of dataFromCart) {
                                    p.subTotal = Number(p.subTotal) - amountToDecrese;
                                };
                                break;
                            };

                        };
                    };
                } else {
                    throw `Your cart dosen't contain products form ${couponData.category} category to apply coupon`;
                };
            } else {
                for (const product of dataFromCart) {
                    if (couponData.valueType == 'R' && Math.floor(Number(product.total) / Number(product.quantity)) > Number(couponData.value)) {
                        // decrese total of single prduct;
                        product.total = Number(product.total) - Number(couponData.value);
                        product.coupenApplied = true;
                        // decreasign subtotal
                        for (const p of dataFromCart) {
                            p.subTotal = Number(p.subTotal) - Number(couponData.value);
                        };
                        break;
                    } else if (couponData.valueType == 'R') {
                        throw ('This coupon is not applicabe for this prouduct. Product value is less than coupen value');
                    } else if (couponData.valueType == 'P') {
                        const amountToDecrese = parseFloat((Number(couponData.value) * Math.floor(Number(product.total) / Number(product.quantity))) / 100).toFixed(2);

                        product.total = Number(product.total) - amountToDecrese;
                        product.coupenApplied = true;
                        // decreasign subtotal
                        for (const p of dataFromCart) {
                            p.subTotal = Number(p.subTotal) - amountToDecrese;
                        };
                        break;
                    };
                };
            };

            // result with total with coupen applied;
            return dataFromCart;

        } else {
            //... No valid coupon found
            throw 'Invalid coupon code';
        };

    } catch (error) {
        throw error;
    };
};

export const remove = async (couponCode) => {
    try {
        const removed = await db.coupens.deleteOne({ code: couponCode });
        return 'Successfully removed coupon';
    } catch (error) {
        throw error;
    };
};

const test = async () => {
    try {
        const data = await check('6pxw23gPVG0AlKh3IE6or782V', 'HUAOLLTBLC');
        console.log('TEST_RESULT => ', data);
    } catch (error) {
        console.log('TEST_ERR => ', error);
    }
}
// test();  