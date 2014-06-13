# Efficient streaming of a HTTP POST to different services

## Description

Written for NodeJS and its light-weight framework Express, this code is intended to proxify a POST request in order to achieve 2 missions :

- transform the return of the request, not only the headers (which can be done by NGINX), but also the body content (conversion, enrichment with other data,...)

- record the POST request (record the streaming) to Amazon AWS S3 service


The advantages of this streaming approach are :

- Security : it is often advised not to use Express BodyParser on all requests, and by default, BodyParser is now proposed only for application/json and application/x-www-form-urlencoded.
For multipart/form-data, the use of Formidable plugin saves the file locally which presents a great security risk.

- Multiplexing : it's possible to stream to many different services in the mean time ! For example to a visual search service and to a log service, where you save all incoming images.

- Stateless conception : with streaming rather than saving to local tmp directory, instances are much more stateless.


=====

## Usage

In app.js be careful not to use any parser middleware services before.


```js
var app = express();
var api = require("lib/api.js")

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', routes);
app.use('/api', api);
```

In api.js, I put configuration + security credentials for a specific user I created for this service. For security purposes, I create an IAM User per bucket and script.

```js
var router = express.Router();
var visualsearch = require('../lib/multiplexing');
router.post('/multiplexing', visualsearch.submit(
  "IP.IP.IP.IP",
  "/search",
  "aws_access_key",
  "aws_secret_key",
  "your_bucket_name"));
router.get('/multiplexing', function(req, res) {
  res.send('Use this service with POST method. Otherwise \
  <form enctype="multipart/form-data"  method="post">\
  <input type="text" name="id" />\
  <input type="file" name="fname" />\
  <input type="submit" value="Search" />\
  </form>\
  ');
});

```
