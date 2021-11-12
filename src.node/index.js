// todo! Support Actions of thumbnailing, converting
// todo! Terraform code
// todo! CI/CD
// todo! Tests

const ERROR_403 = {"error": 403};
const S3Object = require('./lib/s3.js');

// milliseconds of time an operation (convert, identify, etc) can take

const OPERATOR_TIMEOUT_MS=60000;

const DEFAULT_ACTIONS = [
    { "command": "convert", "to": "JPG"},
    { "command": "thumbnail", "size": 1024},
    { "command":  "identify"}
]

// milliseconds of time we're allowed to save to S3 before timeout
const SAVE_TIMEOUT_MS=10000;

const gm = require('gm').subClass({ imageMagick: true });

const CONFIG = {
    "DefaultConvert" : "JPG",
};

function generateResult(event, action, data, attributes={}) {


    let extension;

    if (attributes.hasOwnProperty("extension")) {
        extension = attributes.extension;
    } else {
        switch (action) {
            case "identify":
                extension = ".json"
                break;
            case "convert":
                extension = `.${CONFIG['DefaultConvert'].toLowerCase()}`
                break;
            default:
                extension = ".dat"
                break;
        }
    }

    let sourceImage = new S3Object(event.source, false);
    let keyParts = sourceImage.Key.split("/");
    keyParts[0] = action;

    let newKey = keyParts.join("/");

    //Change extension
    newKey = newKey.substr(0, newKey.lastIndexOf(".")) + extension;

    return {
        "event": event,
        "data": data,
        "action": action,
        "saveAs": `s3://${sourceImage.Bucket}/${newKey}`
    };
}

function identify(event, s3Data) {
    return new Promise((resolve, reject) => {

        const timer = setTimeout(() => {
            reject(new Error(`Could not identify the image within ${OPERATOR_TIMEOUT_MS} ms`));
        }, OPERATOR_TIMEOUT_MS);

        console.log("[^] Identify Begin");
        let m = gm(s3Data.Body);
        m.identify((err, value) => {
            if (err) {
                console.error("Identification Error", err);
                reject(err);
            }
            console.log("[v] Identify Done");

            let result = generateResult(event, "identify", JSON.stringify(value, null, 2));
            resolve(result);

        });


    });
}

function thumbnail(event, s3Data, size) {
    return new Promise( (resolve, reject) => {
        console.log("[^] Thumbnail Begin");
        const timer = setTimeout(() => {
            reject(new Error(`Could not convert the image within ${OPERATOR_TIMEOUT_MS} ms timeout`));
        }, OPERATOR_TIMEOUT_MS);

        gm(s3Data.Body).scale(size, null).toBuffer("JPG", (err, buffer) => {
            if (err) { reject(err);}
            console.log("[v] Thumbnail Done");
            let result = generateResult(event, "thumbnail", buffer, {"extension": `.${size.toString()}.jpeg`});
            resolve(result);
        });


    });
}

function convert(event, s3Data, to) {
    return new Promise((resolve, reject) => {

        to = to.toUpperCase();

        // I spent too many hours debugging this stupid typo...
        if ( to == "JPEG") {
            to = "JPG"
        }

        const timer = setTimeout(() => {
            reject(new Error(`Could not convert the image within ${OPERATOR_TIMEOUT_MS} ms timeout`));
        }, OPERATOR_TIMEOUT_MS);

        try {

            console.log("[^] Convert Begin");
            let m = gm(s3Data.Body);
            m.toBuffer(to,(err, buffer) => {
                if (err) {
                    console.error(`Conversion to ${to} has failed.`);
                    if (err.toString().includes("Stream yields empty buffer")) {
                        console.error(`Perhaps ${to} is not a valid conversion type here?`);
                    }

                    return reject(err);
                }

                console.log("[v] Convert Done");
                let result = generateResult(event, "convert", buffer, {"extension": `.${to.toLowerCase()}`});
                resolve(result);
            });

        }
        catch(err) {
            reject(err);
        }


    });
}

function saveResult(data) {
    return new Promise( (resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Trying to save to S3 timed out after ${OPERATOR_TIMEOUT_MS} ms`));
        }, SAVE_TIMEOUT_MS);

        let save = new S3Object(data.saveAs, false).put(data.data).then( s3PutResults => {
            resolve({
                "object": data.saveAs,
                "results": s3PutResults
            });
        }).catch(err => {
            reject({
                "object": data.saveAs,
                "error": err
            });
        });


    });

}

function handler(event) {


    const sourceImage = new S3Object(event.source);

    const handlerPromise = new Promise( (resolve, reject) => {
        console.log("==BEGIN==", event);
        if (!(event.hasOwnProperty("source"))) {
            reject("event.source is not defined.");
        }

        resolve(event);
    }).then( event => {
        // FETCH
        return sourceImage.get();

    } ).then( s3Data => {
        console.log({ "LastModified": s3Data.LastModified, "ETag": s3Data.ETag, "MetaData": s3Data.MetaData});
        // Promise from S3 has resolved, we have data.

        if (!(event.hasOwnProperty("actions"))) {
            event.actions = DEFAULT_ACTIONS;
        }

        return Promise.all(event.actions.map(action => {
           if (!(action.hasOwnProperty("command"))) {
               console.error(action);
               throw "Action does not have property 'command'!"
           };
           switch(action.command) {
               case "identify":
                   return identify(event, s3Data);
               case "convert":
                   return convert(event, s3Data, action.to || "JPG")
               case "thumbnail":
                   return thumbnail(event, s3Data, action.size || 1024);
               default:
                   return Promise.reject(`Action ${action.command} is not understood.`);
           }


        }));


    }).then( readyForSave => {
        return Promise.all(readyForSave.map(saveItem => {
            return saveResult(saveItem);
        }));

    }).catch(err => {
        console.error("Promise chain has failed us", err);
        throw(err);

    });

    return handlerPromise;


}

if (require.main === module) {

    const stdin = process.stdin;
    const callback = console.log; // Poor man's promise callback for local testing

    let data = '';

    stdin.setEncoding('utf8');

    stdin.on('data', function (chunk) {
        data += chunk;
    });

    stdin.on('end', async function () {
        let event = JSON.parse(data);

        handler(event).then(results => {
            callback(null, results);
        }).catch(err => {
            callback(err, ERROR_403);
        });

    });

}

// Lambda call
exports.handler = (event, context, callback) => {
    handler(event).then(results => {
        callback(null, results);
    }).catch(err => {
        console.error("ERROR", err);
        callback(err, ERROR_403);
    });
};
