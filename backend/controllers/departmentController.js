import Department from "../models/Department.js";

export async function getDepartments(_request, response) {
  const departments = await Department.find().sort({ name: 1 });

  response.json({
    status: "success",
    data: { departments },
  });
}
