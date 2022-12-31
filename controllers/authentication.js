const User = require("../models/user");
const { check, validationResult } = require("express-validator");
var jwt = require("jsonwebtoken");
var expressJwt = require("express-jwt");
const formidable = require("formidable");
const { Greengrass } = require("aws-sdk");
const { postPinfromUser } = require("./pin_sp");
const { Organization } = require("../models/organization");
exports.signup = async (data, req, res) => {
  const {
    username,
    email,
    phone_number,
    location,
    pincode,
    street,
    area,
    origanization,
  } = req.body;

  if (!username) {
    return res.status(400).json({
      error: "username is required",
    });
  }
  if (!email) {
    return res.status(400).json({
      error: "email is required",
    });
  }
  var regexEmail = /\S+@\S+\.\S+/;
  if (email) {
    if (!regexEmail.test(email)) {
      return res.status(400).json({
        error: "email is invalid",
      });
    }
  }
  if (!phone_number) {
    return res.status(400).json({
      error: "phone_number is required",
    });
  }
  // if (!location) {
  //   return res.status(400).json({
  //     error: "location is required"
  //   });
  // }
  if (!pincode || !street || !area) {
    return res.status(400).json({
      error: "Pincode,street,area is required",
    });
  }

  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }
  // origanizations details check
  let findOrg = await Organization.findOne({ _id: origanization });
  console.log(findOrg, "findOrg");

  let adminAcessLimit = findOrg.limits.admin.limit;
  let adminUsersLength = findOrg.limits.admin.users.length;
  // customer limit
  let customerAcessLimit = findOrg.limits.customer.limit;
  let customerUsersLength = findOrg.limits.customer.users.length;
  //delivery limit
  let delieryAcessLimit = findOrg.limits.delivery.limit;
  let delieryUsersLength = findOrg.limits.delivery.users.length;
  // supplier limit
  let SupplierAcessLimit = findOrg.limits.supplier.limit;
  let SupplierUsersLength = findOrg.limits.supplier.users.length;

  User.findOne({ phone_number: phone_number }).then((user) => {
    if (user) {
      return res.status(400).json({
        err: "User already exist",
      });
    } else if (adminUsersLength >= adminAcessLimit) {
      return res
        .status(201)
        .json({ message: " your admin acesss limit exceeded" });
    } else if (customerUsersLength >= customerAcessLimit) {
      return res
        .status(201)
        .json({ message: " your vender acesss limit exceeded" });
    } else if (delieryUsersLength >= delieryAcessLimit) {
      return res
        .status(201)
        .json({ message: " your Delivery acesss limit exceeded" });
    } else if (SupplierUsersLength >= SupplierAcessLimit) {
      return res
        .status(201)
        .json({ message: " your Supplier acesss limit exceeded" });
    } else {
      const user = new User(req.body);
      user.photo = data.Location;
      user.address.pincode = req.body.pincode;
      user.address.street = req.body.street;
      user.address.area = req.body.area;
      user.isShipper = req.body.isShipper;

      // org
      Organization.findOneAndUpdate(
        {
          _id: origanization,
        },
        { upsert: true, new: true }
      ).exec((err, org) => {
        if (err) {
          console.log(err, "err in line number 86");
        }

        if (user.role === 1) {
          let adminArray = org.limits.admin.users;
          adminArray.push(user._id);
        }

        if (user.role === 0) {
          let customerArray = org.limits.customer.users;
          customerArray.push(user._id);
        }

        if (user.role === 2) {
          let delivertArray = org.limits.delivery.users;
          delivertArray.push(user._id);
        }

        if (user.role === 3) {
          let SupplierArray = org.limits.supplier.users;
          SupplierArray.push(user._id);
        }

        // data save in mongodb

        org.save((err, data) => {
          if (err) {
            return res
              .status(400)
              .json({ err: "Data not saved in Origanization DB" });
          }
          console.log(data, "origanization");
          console.log(org.limits.admin.users, "admin users");
        });
      });

      user.save((err, user) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            err: "NOT able to save user in DB",
          });
        }

        postPinfromUser(req, res);
        res.json({
          role: user.role,
          username: user.username,
          email: user.email,
          location: user.location,
          id: user._id,
          pincode: user.address.pincode,
          photo: data ? data.Location : "",
          isShipper: user.isShipper,
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  const errors = validationResult(req);
  const { phone_number, password } = req.body;

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }

  User.findOne({ phone_number }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "USER does not exists",
      });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "phone number and password do not match",
      });
    }

    //create token
    const token = jwt.sign({ _id: user._id }, process.env.SECRET);
    //put token in cookie
    res.cookie("token", token, { expire: new Date() + 9999 });

    //send response to front end
    const {
      _id,
      username,
      phone_number,
      location,
      email,
      role,
      vendor_category,
    } = user;
    return res.status(200).json({
      token,
      user: {
        _id,
        username,
        phone_number,
        location,
        email,
        role,
        vendor_category,
      },
    });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token");
  res.json({
    message: "User signedout",
  });
};
exports.getAllUsers = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 8;
  // const limit = 10;
  sortBy = req.query.limit ? parseInt(req.query.limit) : "_id";
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  User.find().exec((err, users) => {
    if (err || !users) {
      return res.status(400).json({
        error: "no users found",
      });
    }

    const results = {};
    if (endIndex < users.length) {
      results.next = {
        page: page + 1,
        limit: limit,
      };
    }
    results.total = {
      total_records: users.length,
    };
    if (startIndex > 0) {
      results.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    results.results = users.slice(startIndex, endIndex);
    if (!req.query.limit) {
      res.json(users);
    } else {
      res.json(results);
    }
  });
};

//protected routes
exports.isSignedIn = expressJwt({
  secret: process.env.SECRET,
  algorithms: ["HS256"],
  userProperty: "authentication",
});
exports.isthere = (req, res, next) => {
  let checker = req.headers["authorization"];
  const gg = jwt.verify(req.cookies.token, process.env.SECRET);
  User.findById(gg._id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "user not found in database 2",
      });
    }
    req.profile = user;
    next();
  });
  if (!checker) {
    return res.status(403).json({
      error: "ACCESS DENIED",
    });
  }
  next();
};
exports.isAuthenticated = (req, res, next) => {
  let auth = req.headers["authorization"];

  const token = auth.substring(7, auth.length);
  const requestAuth = jwt.verify(token, process.env.SECRET);
  User.findById(requestAuth._id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "user not found in database",
      });
    }
    req.user = user;

    let checker = requestAuth._id && auth && requestAuth._id == user._id;
    if (user.role !== 1) {
      if (!checker) {
        return res.status(403).json({
          error: "ACCESS DENIED",
        });
      }
    }

    next();
  });
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role === 0 || req.user.role === 2 || req.user.role === 3) {
    return res.status(403).json({
      error: "access denied,You are not an admin",
    });
  }

  next();
};

exports.createShipper = (data, req, res) => {
  console.log(req.body, "username");
  const { username, email, phone_number, role, passsword } = req.body;

  if (!username) {
    return res.status(400).json({
      error: "username is required",
    });
  }
  if (!email) {
    return res.status(400).json({
      error: "email is required",
    });
  }
  var regexEmail = /\S+@\S+\.\S+/;
  if (email) {
    if (!regexEmail.test(email)) {
      return res.status(400).json({
        error: "email is invalid",
      });
    }
  }
  if (!phone_number) {
    return res.status(400).json({
      error: "phone_number is required",
    });
  }

  if (!role) {
    return res.status(400).json({
      error: "Role is required",
    });
  }
  // if (!location) {
  //   return res.status(400).json({
  //     error: "location is required"
  //   });
  // }

  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  const errors = validationResult(req.body);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
    });
  }
  User.findOne({ phone_number: phone_number }).then((user) => {
    if (user) {
      return res.status(400).json({
        err: "User already exist",
      });
    } else {
      const user = new User(req.body);

      user.save((err, user) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            err: "NOT able to save user in DB",
          });
        }
        postPinfromUser(req, res);
        res.json({
          role: user.role,
          username: user.username,
          phone_number: user.phone_number,
          email: user.email,
          isShipper: user.isShipper,
        });
      });
    }
  });
};
