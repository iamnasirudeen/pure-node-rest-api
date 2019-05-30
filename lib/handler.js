/*
* Request handlers
*
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Define handlers (they are the incharge of rendering a page based on a particular url)
var handlers = {}

// Get the users handler
handlers.users = function (data, callback) {
    var acceptableMethods = ['get', 'post', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    }
}

// Container for users submethods
handlers._users = {}

// Users - post
// Required data : firstname, lastname, phone, password, tosAgreement
// Optional data : none
handlers._users.post = function (data, callback) {
    // Check that all required fields are filled out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'number' && data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        _data.read('users', phone, function (err, data) {
            if (!err) {
                // Hash the password
                var hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // Create the user object
                    var userObject = {
                        'firstame': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    // Store the user
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200)
                        } else {
                            console.log(err);
                            callback(500, { 'Error': 'Could not create a new user' });
                        }
                    })
                } else {
                    callback(500, { 'Error': 'Could not has the user\'s password' });
                }

            } else {
                // User already exist
                callback(400, { 'Error': 'A user with that phone number already exist' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
}

// Users - get
// Required data : phone
// Optional data : none
// @TODO only let an authenticated user access their object. Don't let them access anyone elses.
handlers._users.get = function (data, callback) {
    // Check that the phone number provided is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Lookup the user
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                // Remove the hashed password from the user object before returning it to the requester
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404);
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
}

// Users - put
// Required data : phone
// Optional data : firstname, lastname, password (at least one must be specified);
// @TODO only let an authenticate user update their object. Don't let them update anyone else's.
handlers._users.put = function (data, callback) {
    // Check for the required field
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    // Check for the optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if the phone is invalid
    if (phone) {
        // Error if nothing is sent to update
        if (firstName || lastName || password) {
            // Lookup the user
            _data.read('users', phone, function (err, userData) {
                if (!err && userData) {
                    // Update the necessary fields
                    if (firstName) {
                        userData.firstName = firstName
                    }
                    if (lastName) {
                        userData.lastName = lastName
                    }
                    if (password) {
                        userData.hashedPassword = helpers.hash(password)
                    }
                    // Store the new updates
                    _data.update('users', phone, userData, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error': 'Could not update the user' });
                        }
                    })
                } else {
                    callback(400, { 'Error': 'The specified user does not exist' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing fields to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
}

// Users - delete
// Required field : phone
// @TODO only let an authenticated user dlete their object. Don't let them delete anyone else's.
// @TODO cleanup(delete) any other data files associated with this user
handlers._users.delete = function (data, callback) {
    // Check that the phone number is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length > 0 ? data.queryStringObject.phone.trim() : false;
    if (phone) {
        // Lookup the user
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                _data.delete('users', phone, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete the specified user' });
                    }
                })
            } else {
                callback(400, { 'Error': 'Could not find the specified user' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
}



// Get the tokens handler
handlers.tokens = function (data, callback) {
    var acceptableMethods = ['get', 'post', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    }
}

// Container for all the tokens method
handlers._tokens = {};

// Tokens - Post
// Required data : phone, password
// Optional data : none
handlers._tokens.post = function (data, callback) {
    var phone = typeof (data.payload.phone) == 'number' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        // Lookup the user who mathces that phone number
        _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
                // Hash the password and compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // if valid, create a new token with a random name. Set expiration date to 1 (one) hour in the future
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                } else {
                    callback(400, { 'Error': `Password did not match the specified user's stored password` });
                }
            } else {
                callback(400, { 'Error': 'No user matches your request' });
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

// Tokens - Get
handlers._tokens.get = function (data, callback) {

}

// Tokens - put
handlers._tokens.put = (data, callback) => {

}

// Tokens -Delete
handlers._tokens.delete = (data, callback) => {

}



// Get the ping handler
handlers.ping = function (data, callback) {
    callback(200)
}

// Not found handler (404)
handlers.notFound = function (data, callback) {
    callback(404);
}

// Exports handlers
module.exports = handlers;