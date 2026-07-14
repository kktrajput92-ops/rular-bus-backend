const Counter = require("../models/counter.model");

// Get All Counters
const getCounters = async (req, res) => {
  try {
    const counters = await Counter.getAll();

    res.json({
      success: true,
      data: counters,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Counter By ID
const getCounterById = async (req, res) => {
  try {
    const counter = await Counter.getById(req.params.id);

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found",
      });
    }

    res.json({
      success: true,
      data: counter,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Create Counter
const createCounter = async (req, res) => {
  try {
    const counter = await Counter.create(req.body);

    res.status(201).json({
      success: true,
      message: "Counter created successfully",
      data: counter,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getCounters,
  getCounterById,
  createCounter,
};
