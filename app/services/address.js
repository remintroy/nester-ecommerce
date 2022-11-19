import * as auth from './auth.js';
import * as db from './schema.js';
import * as util from './util.js';

export const validator = (UID, address) => {
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

            if ((houseNumber + "").length < 1) throw 'Invalid house number / name';
            else userOutput.houseNumber = houseNumber;

            if ((streetNumber + "").length < 1) throw 'Invalid street number / name';
            else userOutput.streetNumber = streetNumber;

            if (isNaN(Number(postalCode)) && postalCode || (postalCode + "").length != 6) throw 'Invalid postal code';
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
export const deleteAddress = (UID, bodyWithAddressID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const addressOutput = await validator(UID, bodyWithAddressID);

            try {

                const data = await db.address.updateOne({ UID: addressOutput.UID }, {
                    $pull: {
                        'address': { _id: addressOutput.addressID }
                    }
                });

                if (data.modifiedCount > 0) {
                    resolve("Address removed successfully");
                } else {
                    resolve("Nothing to remove");
                };

            } catch (error) {
                reject("Error removing address from db");
            };
        } catch (error) {
            reject(error); return 0;
        };
    });
};
export const getAll = (UID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            try {

                const data = await db.address.findOne({ UID: userOutput.UID });
                const result = [];
                
                if (data?.address) {
                    const keys = Object.keys(data?.address[0]?._doc);
                    for (let i = 0; i < data?.address?.length; i++) {
                        const output = {};
                        for (let j = 0; j < keys.length; j++) {
                            output[keys[j]] = data?.address[i][keys[j]];
                            if (keys[j] == 'country' && data?.address[i][keys[j]]) {

                                if (data?.address[i][keys[j]].length == 2) {
                                    output.countryCode = data?.address[i][keys[j]];
                                } else {
                                    let dataCountry = await util.getCountryByName(data?.address[i][keys[j]]);
                                    output.countryCode = dataCountry.code;
                                };

                            };
                        };
                        result.push(output);
                    };
                };

                // for(let i=0; i<data?.address?.length; i++){
                //     const output = {};
                //     for(let j=0; j<keys.length; j++){
                //         output[keys[j]] = data?.address[i][keys[j]]
                //         if (keys[j] == 'country' && data?.address[i][keys[j]]) {

                //             if(data?.address[i][keys[j]].length==2){
                //                 output.countryCode = data?.address[i][keys[j]];
                //             }else{
                //                 util.getCountryByName(data?.address[i][keys[j]]).then(data=>{
                //                     output.countryCode = data.code;
                //                 });
                //             };

                //         };
                //     };
                //     result.push(output);
                // };

                // loopFunciton((data?.address?.length)-1);

                // function loopFunciton(i){
                //     const output = {};
                //     innerLoopFunction((keys.length)-1);
                //     function innerLoopFunction(j){

                //         output[keys[j]] = data?.address[i][keys[j]]
                //         if (keys[j] == 'country' && data?.address[i][keys[j]]) {

                //             if(data?.address[i][keys[j]].length==2){
                //                 output.countryCode = data?.address[i][keys[j]];
                //             }else{
                //                 util.getCountryByName(data?.address[i][keys[j]]).then(data=>{
                //                     output.countryCode = data.code;
                //                 });
                //             };
                //         };

                //         if(j!=0) innerLoopFunction(--j);
                //     };
                //     result.push(output);
                //     if(i!=0) loopFunciton(--i);
                // };

                // loopFunciton((data?.address?.length) - 1);

                // function loopFunciton(i) {
                //     const output = {};
                //     innerLoopFunction((keys.length) - 1);
                //     async function innerLoopFunction(j) {

                //         output[keys[j]] = data?.address[i][keys[j]]
                //         if (keys[j] == 'country' && data?.address[i][keys[j]]) {
                //             if (data?.address[i][keys[j]].length == 2) {
                //                 output.countryCode = data?.address[i][keys[j]];
                //             } else {
                //                 output.countryCode = await util.getCountryByName(data?.address[i][keys[j]]).code;
                //             };
                //         };

                //         if (j != 0) innerLoopFunction(--j);
                //     };
                //     result.push(output);
                //     if (i != 0) loopFunciton(--i);
                // };

                // for (const a of data?.address) {
                //     const output = {};
                //     for (const k of keys) {
                //         output[k] = a[k];
                //         if (k == 'country' && a[k]) {
                //             if (a[k].length == 2) {
                //                 output.countryCode = a[k];
                //             } else {
                //                 output.countryCode = await util.getCountryByName(a[k]).code;
                //             };
                //         };
                //     };
                //     result.push(output);
                // };

                // function loopFunciton() {
                //     return new Promise(async resolve => {
                //         const result = [];
                //         for (const a of data?.address) {
                //             const output = {};
                //             for (const k of keys) {
                //                 output[k] = a[k];
                //                 if (k == 'country' && a[k]) {
                //                     if (a[k].length == 2) {
                //                         output.countryCode = a[k];
                //                     } else {
                //                         output.countryCode = await util.getCountryByName(a[k]).code;
                //                     };
                //                 };
                //             };
                //             result.push(output);
                //         };
                //         resolve(result);
                //     });
                // };

                // console.log("result => ", await loopFunciton());

                // console.log("result => ", result);

                // setInterval(() => {
                //     console.log("result => ", result);
                // }, 1000);

                resolve(result);

            } catch (error) {
                console.log(error)
                reject('Error while fetching address');
            };

        } catch (error) {
            reject(error);
        };
    });
};
export const save = (UID, address) => {
    return new Promise(async (resolve, reject) => {
        try {
            const addressOutput = await validator(UID, address);
            try {
                // result filterd address
                const addressToSave = {};
                const keys = Object.keys(addressOutput);
                keys.forEach(async e => {
                    if (addressOutput[e]) addressToSave[e] = addressOutput[e];
                    if (e == 'country' && addressOutput[e]?.length == 2) {
                        let code = await util.getCountryBycode(addressOutput[e]);
                        addressToSave[e] = code.name;
                    }
                });

                // check for existatnce of certian fields 
                const ExistingData = await db.address.find({
                    UID: addressOutput.UID,
                    'address.state': addressToSave.state,
                    'address.country': addressToSave.country,
                    'address.town': addressToSave.town,
                    'address.postalCode': addressToSave.postalCode,
                    'address.houseNumber': addressToSave.houseNumber,
                    'address.streetNumber': addressToSave.streetNumber,
                });

                if (ExistingData.length == 0) {
                    // check for existance of document 
                    const ExistDoc = await db.address.find({ UID: addressOutput.UID });


                    // acton for address save and updates below if and else
                    if (ExistDoc.length > 0) {
                        // update by pushing address to existing document

                        const updatedResult = await db.address.updateOne({ UID: addressOutput.UID }, {
                            $push: {
                                'address': [addressToSave]
                            }
                        });

                        const finalResult = await db.address.find({ UID: addressOutput.UID });
                        const resultTOSend = finalResult[0].address[(finalResult[0].address.length) - 1];

                        // result with all fields and _id l
                        resolve(resultTOSend);
                    } else {
                        // create new address doc in db
                        addressToSave.type = 'primary';

                        const savedData = await db.address({
                            UID: addressOutput.UID,
                            address: [addressToSave]
                        });
                        savedData.save();

                        // result with all fields and _id 2
                        resolve(savedData.address[0]);
                    };
                    //... create new or push to exist one complete for new address
                } else {
                    // if a document with same specific fields exists update 

                    // finds the index to update
                    const indexOfExisting = ExistingData[0].address.map(e => {
                        return e.state == addressOutput.state &&
                            e.country == addressOutput.country &&
                            e.postalCode == addressOutput.postalCode &&
                            e.town == addressOutput.town &&
                            e.streetNumber == addressOutput.streetNumber &&
                            e.houseNumber == addressOutput.houseNumber
                    }).indexOf(true);

                    if (indexOfExisting != -1) {
                        // update
                        const updatedResult = await db.address.updateOne({ UID: addressOutput.UID }, {
                            $set: {
                                [`address.${indexOfExisting}.name`]: addressToSave?.name,
                                [`address.${indexOfExisting}.email`]: addressToSave?.email,
                                [`address.${indexOfExisting}.phone`]: addressToSave?.phone,
                            }
                        });

                        // get updated data
                        const finalResult = await db.address.find({ UID: addressOutput.UID });
                        const resultTOSend = finalResult[0].address[indexOfExisting];

                        // result with all fields and _id 2
                        resolve(resultTOSend);
                    } else {
                        reject('Address not found');
                    };
                };
            } catch (error) {
                reject('Error saving address');
            };
        } catch (error) {
            reject(error);
        };
    });
};
export const getByID = (UID, addressID) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userOutput = await auth.validatior({ UID: UID }, { UIDRequired: true });
            try {
                const data = await db.address.aggregate([
                    {
                        $match: {
                            UID: userOutput.UID
                        }
                    },
                    {
                        $unwind: '$address'
                    },
                    {
                        $match: {
                            'address._id': db.ObjectID(addressID)
                        }
                    }
                ]);
                const keys = Object.keys(data[0].address);
                const output = {};

                for (let j = 0; j < keys.length; j++) {
                    output[keys[j]] = data[0]?.address[keys[j]];
                    if (keys[j] == 'country' && data[0]?.address[keys[j]]) {

                        if (data[0]?.address[keys[j]].length == 2) {
                            output.countryCode = data[0]?.address[keys[j]];
                        } else {
                            let dataCountry = await util.getCountryByName(data[0]?.address[keys[j]]);
                            output.countryCode = dataCountry.code;
                        };

                    };
                };

                resolve(output);
            } catch (error) {
                console.log(error)
                reject('Error while fetching address');
            };
        } catch (error) {
            reject(error);
        };
    });
};
export const update = (UID, address) => {
    return new Promise(async (resolve, reject) => {
        try {
            const addressOutput = await validator(UID, address);
            try {
                const ExistingData = await db.address.find({ UID: UID });
                const index = ExistingData[0]?.address.map(e => e._id == addressOutput.addressID).indexOf(true);
                const dataToUpdate = {};
                Object.keys(addressOutput).forEach(key => {
                    if (addressOutput[key] && key != 'addressID' && key != 'UID') dataToUpdate[`address.${index}.${key}`] = addressOutput[key];
                });
                const updated = await db.address.updateOne({ UID: addressOutput.UID }, {
                    $set: dataToUpdate
                });
                resolve('Updated successfully');
            } catch (error) {
                reject('Error updating address');
            };
        } catch (error) {
            reject(error);
        };
    });
};

const test = async () => {
    try {
        const data = await save('6pxw23gPVG0AlKh3IE6or782V', {
            name: 'remin t roy',
            email: 'reminremin01@gmail.com',
            phone: '9090909090',
            country: 'India',
            houseNumber: '445',
            streetNumber: 'KeralaStreet',
            town: "edappali",
            state: 'Kerala',
            postalCode: '676767',
        });
        console.log("Test result => ", data);
    } catch (error) {
        console.log('TEST ERR => ', error);
    }
}
// test()