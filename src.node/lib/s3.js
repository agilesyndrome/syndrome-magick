const aws = require("aws-sdk");

class S3Object {

    constructor(source, preFetch=true) {

        this.s3 = new aws.S3();

        if (source == undefined) {
            throw "Image source is undefined!";
        }

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
        } else {
            throw `S3 Object Source type is unknown (${typeof(source)}). This is not string or object.`
        }

        if(preFetch == true) {
            // Begin fetching the S3 data.
            this.s3Data = this.get();
        }



    }

    #fromS3Uri(s3Uri) {
        //console.log(`New S3Object (${s3Uri})`)
        this.Uri = s3Uri;

        let splits = s3Uri.replace("s3://", "").split("/");
        this.Bucket = splits[0];
        this.Key = splits.slice(1).join('/')
        return this;
    }

    #fromBucketKey(input) {
        //console.log(`New S3Object (${input}`);
        this.Bucket = input.Bucket;
        this.Key = input.Key;
        this.Uri = `s3://${this.Bucket}/${this.Key}`
    }

    toString() {
        return this.Uri;
    }

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

    put(buffer) {

        console.log(`Writing ${this.toString()}`);

        // Objects must be stringified...
        let saveStream = buffer;

        /*
        if (typeof(buffer) == typeof({"a":2})) {
            saveStream = JSON.stringify(buffer, null, 2);
        } else {
            saveStream = buffer
        }*/

        return this.s3.putObject({
            Bucket: this.Bucket,
            Key: this.Key,
            Body: saveStream
        }).promise();
    }


}

module.exports = S3Object;