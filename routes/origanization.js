const express = require("express");
const router = express.Router();

const { Organization } = require("../models/organization");

router.post("/origanization/create", async (req, res, next) => {
  let fields = req.body;
  const { organizationName, address, ownerDetails, phone, email, limits } =
    fields;
  console.log(Organization);
  const newOrganization = new Organization({
    organizationName: organizationName,
    address: address,
    ownerDetails: ownerDetails,
    phone: phone,
    email: email,
    limits: limits,
  });

  try {
    await newOrganization.save();
    res.status(201).json(newOrganization);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.put("/origanization/:id", async (req, res, next) => {
  const { id } = req.params;
  const { organizationName, address, ownerDetails, phone, email, limits } =
    req.body;

  try {
    const organization = await Organization.findOneAndUpdate(
      { _id: id },
      {
        organizationName: organizationName,
        address: address,
        ownerDetails: ownerDetails,
        phone: phone,
        email: email,
        limits: limits,
      }
    );
    res.json(organization);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/origanization/:id", (req, res, next) => {
  const { id } = req.params;
  Organization.findOne({ _id: id })
    // .populate({
    //   path: "limits.admin.users",
    // })
    .exec((err, organization) => {
      if (err) {
        console.log(err);
        next(err);
      }
      res.status(200).json(organization);
      console.log(organization.limits.admin.users, "admin users");

      next();
    });
});

router.get("/organization/all", (req, res) => {
  Organization.find({}, (err, org) => {
    if (err) {
      res.status(500).send({
        message: err,
      });
    } else {
      res.status(200).send(org);
    }
  });
});

module.exports = router;
