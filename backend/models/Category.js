import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
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
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

categorySchema.index(
  { department: 1, normalizedName: 1 },
  { unique: true }
);

export default mongoose.model("Category", categorySchema);
