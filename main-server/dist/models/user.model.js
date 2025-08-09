import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
export const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    instances: [{
            type: Schema.Types.ObjectId,
            ref: "Instance",
            default: []
        }]
}, {
    timestamps: true,
});
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 5);
    }
    next();
});
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};
const User = mongoose.model("User", userSchema);
export default User;
//# sourceMappingURL=user.model.js.map