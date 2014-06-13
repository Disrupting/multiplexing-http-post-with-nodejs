var http = require('http');
var Uploader = require('s3-upload-stream').Uploader;
var querystring = require('querystring');

exports.submit = function (ip,path,aws_access_key,aws_secret_key,bucket) {
  return function(req, res, next){

      var fileSize = req.headers['content-length'];
      var contentType = req.headers['content-type'];

      console.log("FILE SIZE "+fileSize)
      console.log("Content Type "+contentType)
      var uploadedBytes = 0 ;
      var queryData = "";
      var file="";
      var service_return="";

      var request_init, s3stream_init;

      // initialization of service stream object
      var request = http.request({
        method: 'POST',
        host: ip,
        path: path,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileSize
        }
      }, function(requestres) {
        console.log('STATUS: ' + requestres.statusCode);
        res.statusCode = requestres.statusCode;
        res.setHeader("Content-Type","application/json")
      //  for (header in requestres.headers){ res.setHeader(header, requestres.headers[header]) }
        console.log('HEADERS: ' + JSON.stringify(requestres.headers));
        requestres.setEncoding('utf8');
        requestres.on('data', function (chunk) {
          console.log('BODY: ' + chunk);
          service_return += chunk;
          //res.write(chunk)
        });
        requestres.on('end', function () {
          console.log('END ');
          res.write(transform(service_return))
          res.end();
          console.log(file);
        });

      });
      request_init=true;
      dispatch();


      // Initialization of stream object for S3
      var up;
      var UploadStreamObject = new Uploader(
        {
          "accessKeyId": aws_access_key,
          "secretAccessKey": aws_secret_key,
          "region": "us-east-1"
        },
        // Upload destination details.
        // For a full list of possible parameters see:
        // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#createMultipartUpload-property
        {
          "Bucket": bucket,
          "Key": "uploaded-file-name " + new Date()
        },
        function (err, uploadStream)
        {
          if(err)
            console.log(err, uploadStream);
          else
          {
            up = uploadStream;
            console.log('UploadStream initialized ');
            // This event is emitted when a single part of the stream is uploaded.
            uploadStream.on('chunk', function (data) {
              console.log(data);
            });

            // Emitted when all parts have been flushed to S3 and the multipart
            // upload has been finalized.
            uploadStream.on('uploaded', function (data) {
              console.log(data);
            });

            s3stream_init=true;
            dispatch();

          }
        }
      );


    // Streaming dispatch on the two services
    function dispatch() {

      if( request_init == undefined || s3stream_init == undefined) return;

      console.log("INITIALIZATION OK")

      req.on('data',function(d){
        uploadedBytes += d.length;
        var p = (uploadedBytes/fileSize) * 100;
        console.log("Uploading " + parseInt(p)+ " %\n");
        queryData += d;
        if(queryData.length > 1e6) {
            queryData = "";
            res.writeHead(413, {'Content-Type': 'text/plain'});
          //  res.write("Too big chunk");
            res.end();
            req.connection.destroy();
        } else {
          request.write(d);
          up.write(d);
        }
      });

      req.on('end',function(){
        console.log("File Upload Complete");
        request.end();
        up.end();
      });

      req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });
    }

  };
};


// transform the body returned

function transform(xml) {
  return xml;
}
