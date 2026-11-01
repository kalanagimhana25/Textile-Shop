import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      select: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: true }
);

departmentSchema.index({ normalizedName: 1 }, { unique: true });

export default mongoose.model("Department", departmentSchema);
