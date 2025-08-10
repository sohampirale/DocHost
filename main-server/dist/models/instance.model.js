import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
export const instanceSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    API_KEY: {
        type: String
    },
    opearatingSystem: {
        type: String
    },
    labName: {
        type: String
    },
    maxContainers: {
        type: Number,
        default: 10
    }
}, {
    timestamps: true,
});
instanceSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 5);
    }
    next();
});
instanceSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};
const Instance = mongoose.model("Instance", instanceSchema);
export default Instance;
//# sourceMappingURL=instance.model.js.map