// todo! Support Actions of thumbnailing, converting
// todo! Terraform code
// todo! CI/CD
// todo! Tests

const ERROR_403 = {"error": 403};
const gm = require('gm').subClass({ imageMagick: true });
const aws = require('aws-sdk');


class Image {

    /*
    /// Constructor can take source of several forms:
    * s3://bucket/key
    * { Bucket: bucket-name, Key: key/of/s3/object }s
     */
    constructor(source) {

        this.s3 = new aws.S3();

        // { source: "s3://bucket/key" }
        if (typeof(source) == typeof("some string")) {
            if (source.startsWith("s3://")) {
                this.#fromS3Uri(source);
            } else {
                throw "Source is string, but does not start with s3://"
            }
        } else if (typeof(source) == typeof({some: "object"})) {
            if ((source.hasOwnProperty("Bucket")) && (source.hasOwnProperty("Key"))) {
                this.#fromBucketKey(source)
            } else {
                throw "Source is object, but does not have properties Bucket and/or Key"
            }
        }

        // Begin fetching the S3 data.
        this.s3Data = this.get();

    }

    #fromS3Uri(s3Uri) {
        this.Uri = s3Uri;

        let splits = s3Uri.replace("s3://", "").split("/");
        this.Bucket = splits[0];
        this.Key = splits.slice(1).join('/')
        return this;
    }

    #fromBucketKey(input) {
        this.Bucket = input.Bucket;
        this.Key = input.Key;
        this.Uri = `s3://${this.Bucket}/${this.Key}`
    }

    toString() {
        return this.Uri;
    }

    withS3(callback) {
        return this.s3Data.then(callback)
    }

    /*identify() {

        let imageData = this.get().then(imageData => {

        })
    }
        gm(imageData.Body).identify(function(err, image_identity) {
    }*/

    get() {

        // Have we already called .get before?
        if (this.s3Data != undefined) {
            console.log(`S3Get (Pre-existing) ${this.toString()}`, this.s3Data);
            return this.s3Data
        }

        console.log(`S3Get ${this.toString()}`);

        return this.s3.getObject({
            "Bucket": this.Bucket,
            "Key": this.Key
        }).promise();

    }

    async put(buffer) {
        console.log(`Writing ${this.toString()}`);
        return this.s3.putObject({
            Bucket: this.Bucket,
            Key: this.Key,
            Body: buffer
        }).promise();
    }


}

const CONFIG = {
    "SetFormat" : process.env['IMAGE_SET_FORMAT']
};

const OPERATOR_TIMEOUT_MS=10000;

function identify(s3Data) {
    return new Promise((resolve, reject) => {

        const timer = setTimeout(() => {
            reject(new Error(`Promise timed out after ${OPERATOR_TIMEOUT_MS} ms`));
        }, OPERATOR_TIMEOUT_MS);

        console.log("Identification Begin");
        let m = gm(s3Data.Body);
        m.identify((err, value) => {
            if (err) {
                console.error("Identification Error", err);
                reject(err);
            }
            console.log("Identification complete");
            resolve(value);
        });


    });
}



function convert(s3Data, to) {
    return new Promise((resolve, reject) => {

        const timer = setTimeout(() => {
            reject(new Error(`Promise timed out after ${OPERATOR_TIMEOUT_MS} ms`));
        }, OPERATOR_TIMEOUT_MS);

        try {

            console.log("Conversion Begin");
            let m = gm(s3Data.Body);
            m.toBuffer(to,(err, buffer) => {
                if (err) {
                    console.error("Failed to Convert", err);
                    reject(err);
                }

                console.log("Conversion End");
                resolve(buffer);
            });

        }
        catch(err) {
            reject(err);
        }


    });
}

function handler(event) {


    const sourceImage = new Image(event.source);

    const handlerPromise = new Promise( (resolve, reject) => {
        console.log("Begin", event);
        // VALIDATION
        if (!(event.hasOwnProperty("source"))) {
            reject("event.source is not defined.");
        }
        resolve(event);
    }).then( event => {
        // FETCH
        return sourceImage.get();

    } ).then( s3Data => {
        console.log("S3 Object has returned");
        // Promise from S3 has resolved, we have data.
        let operatorPromises = Promise.all([
            identify(s3Data),
            convert(s3Data, "JPG")
        ]);



        return operatorPromises;


    }).then( readyForSave => {
        console.log("ReadyForSaves", readyForSave);
    }).catch(err => {
        console.error("Promise chain has failed us", err);
    });

    return handlerPromise;

    // OPERATE
        // Convert
        // Identify
    // SAVE






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
