const Category = require("../models/category");
const { json } = require("body-parser");

exports.getcategoryById = (req, res, next, id) => {
  Category.findById(id).exec((error, cate) => {
    if (error) {
      return res.status(400).json({
        error: "category not found in DB",
      });
    }
    req.category = cate;
    next();
  });
};
exports.deleteCategory = (req, res) => {
  let category = req.category;
  category.remove((err, deletedCategory) => {
    if (err) {
      return res.status(400).json({
        error: "failed to delete the category",
      });
    }
    res.json({
      message: "deleted successfully",
      deletedCategory,
    });
  });
};

exports.createCategory = (req, res) => {
  const category = new Category(req.body);
  category.save((error, cate) => {
    if (error) {
      return res.status(400).json({
        error: "not able to save category in DB",
      });
    }
    res.category = cate;
    res.json({ category });
  });
};

exports.getCategory = (req, res) => {
  return res.json(req.category);
};

exports.getAllCategory = (req, res) => {
  Category.find().exec((error, categories) => {
    if (error) {
      return res.status(400).json({
        error: "No category found",
      });
    }
    res.json(categories);
  });
};
exports.updateCategory = (req, res) => {
  const category = req.category;
  category.name = req.body.name;

  category.save((err, UpdatedCategory) => {
    if (err) {
      return res.status(400).json({
        error: "failed to update the categories",
      });
    }
    res.json(UpdatedCategory);
  });
};
