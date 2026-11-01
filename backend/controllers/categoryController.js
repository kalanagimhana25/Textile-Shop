import mongoose from "mongoose";
import Category from "../models/Category.js";

export async function getCategories(request, response) {
  const filter = {};

  if (request.query.department) {
    if (!mongoose.isValidObjectId(request.query.department)) {
      const error = new Error("Department must be a valid ID.");
      error.statusCode = 400;
      throw error;
    }
    filter.department = request.query.department;
  }

  const categories = await Category.find(filter)
    .populate("department", "name description")
    .sort({ name: 1 });

  response.json({
    status: "success",
    data: { categories },
  });
}
