const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handler');
var helpers = require('./lib/helpers');

// Instantiating the HTTP Server
const httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
})

// Start the HTTP server
httpServer.listen(config.httpPort, function (err, done) {
    if(err) throw err;
    console.log(`Http Server listening on port ${config.httpPort}`);
})

// Instatiating the HTTPS Server
var httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions,function(req, res) {
    unifiedServer(req, res);
})

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(err, done){
    if(err) throw err;
    console.log(`Https server is listening on port ${config.httpsPort}`);
})

// All the server logic for both http and https
var unifiedServer = function(req, res){
    const parsedUrl = url.parse(req.url, true)
    // get the path
    const path = parsedUrl.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    // Get the query string as an object eg localhost:3000?hello=hy
    var queryStringObject = parsedUrl.query;
    // Get the method
    const method = req.method.toLowerCase();
    // Get the headers as an object !.e whats the browser is sendings
    var headers = req.headers;
    // Get the payload if any (that is get strings coming from the user)
    var decoder = new StringDecoder('utf-8');
    var buffer = "";
    req.on('data', data => {
        buffer += data;
    })
    req.on('end', () => {
        buffer += decoder.end();

        //  Choose the handler a request should go to. If one is not found, use the not found handler.
        var chooseHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        
        // Construct the data object to be sent to the choosen handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer) 
        }

        // Route the request specified to the appropriate handler
        chooseHandler(data, function(statusCode, payload){
            // Use the status code callbacked by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload callbacked by the handler or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode);
            res.end(payloadString)

            // log out the response
            console.log(statusCode, payloadString);
        })
    })
}

// Define a router
var router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens
}