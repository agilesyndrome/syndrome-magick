// todo! Support Actions of thumbnailing, converting
// todo! Upgrade Nodejs version
// todo! Terraform code
// todo! CI/CD
// todo! Tests


const ERROR_403 = {"error": 403};

const gm = require('gm').subClass({ imageMagick: true });
const aws = require('aws-sdk');

function make_s3object(bucket, key, body=null) {

  let s3object = {
    Bucket: bucket,
    Key: key
  };



  if (body != null) {
    s3object.Body = body;
  }

  return s3object;
}


function put_s3_object(s3object) {
  let s3 = new aws.S3();
  s3.putObject(s3object, function(err, data) {
    if (err) {
      console.log("Well crap")
      console.error(err);
      return;
    }
    //S3 put response...
    console.log("ALL DONE");
    console.log(data);
  });

}

// convert HEIC to JPEG
exports.handler = async (event, context, callback) => {

    // Sanity Checks
    if (!( "source" in event )) {
        callback("source is missing from input", ERROR_403 )
    }

    if (!( "Bucket" in event.source)) {
        callback("source.Bucket is missing from input", ERROR_403 )
    }

    if (!( "Key" in event.source)) {
        callback("source.Key is missing from input", ERROR_403)
    }

    if ( event.source.Bucket.length == 0) {
        callback("source.Bucket is empty", ERROR_403)
    }

    if ( event.source.Key.length == 0) {
        callback("source.Key is empty", ERROR_403)
    }

    console.log(`Attempting to convert s3://${event.source.Bucket}/${event.source.Key}`);

    let s3 = new aws.S3();

    let s3_head = await s3.headObject(event.source).promise();

    console.log(s3_head);

    let obj = await s3.getObject(event.source).promise();
    console.log(obj);
    console.log(obj.Body);

    gm(obj.Body)
        .toBuffer('JPEG',function (err, buffer) {
          if (err) {
            console.error("Conversion to buffer failed", err);
            return;
          }

          let converted_key = event.source.Key.replace(".HEIC", ".x.JPEG");

          let new_s3_object = make_s3object( event.source.Bucket, converted_key, buffer);
          put_s3_object(new_s3_object);


        })





};
