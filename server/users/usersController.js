// User Controller
// ---------------
//
// The User controller handles requests passed from the User router.

// The bcrypt module is used to salt and encrypt passwords
var User = require( './usersModel.js' ),
  Q = require( 'q' ),
  jwt = require( 'jwt-simple' );

module.exports = {
  signin: function( req, res, next ) {
    var username = req.body.username,
      password = req.body.password;

    var findUser = Q.nbind( User.findOne, User );
    findUser( {
        username: username
      } )
      .then( function( user ) {
        if ( !user ) {
          next( new Error( 'User does not exist' ) );
        } else {
          return user.comparePasswords( password )
            .then( function( foundUser ) {
              if ( foundUser ) {
                var query = User.where({ username: username });
                query.findOne(function(err, result){
                  if (err) return handleError(err);
                  if (result) {
                    // console.log(result);
                    var token = jwt.encode( user, 'secret' );
                    res.json( {
                      token: token,
                      id: result._id,
                      username: result.username,
                    });
                  }
                });
              } else {
                return next( new Error( 'No user' ) );
              }
            } );
        }
      } )
      .fail( function( error ) {
        next( error );
      } );
  },

  signup: function( req, res, next ) {
    var username = req.body.username,
      password = req.body.password,
      create,
      newUser;

    var findOne = Q.nbind( User.findOne, User );

    // check to see if user already exists
    findOne( {
        username: username
      } )
      .then( function( user ) {
        if ( user ) {
          next( new Error( 'User already exist!' ) );
        } else {
          // make a new user if not one
          create = Q.nbind( User.create, User );
          newUser = {
            username: username,
            password: password
          };
          return create( newUser );
        }
      } )
      .then( function( user ) {
        // create token to send back for auth
        var token = jwt.encode( user, 'secret' );
        res.json( {
          token: token,
          userName: username
        } );
      } )
      .fail( function( error ) {
        next( error );
      } );
  },

  checkAuth: function( req, res, next ) {
    // checking to see if the user is authenticated
    // grab the token in the header is any
    // then decode the token, which we end up being the user object
    // check to see if that user exists in the database
    var token = req.headers[ 'x-access-token' ];
    if ( !token ) {
      next( new Error( 'No token' ) );
    } else {
      var user = jwt.decode( token, 'secret' );
      var findUser = Q.nbind( User.findOne, User );
      findUser( {
          username: user.username
        } )
        .then( function( foundUser ) {
          if ( foundUser ) {
            res.send( 200 );
          } else {
            res.send( 401 );
          }
        } )
        .fail( function( error ) {
          next( error );
        } );
    }
  },

  oneUser: function(req, res, next) {

    var username = req.url.slice(1);

    // Bind the userMongoose find method to the Idea model, so that the Q module can use promises with it.
    var query = User.where({ username: username });
    query.findOne(function(err, result){
      if (err) return handleError(err);
      if (result) {
        res.json(result);
      } else {
        res.send(404);
      }
    });
  },

};
