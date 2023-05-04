import mongoose from "mongoose";

interface User {
  name: string;
  email: string;
  password: string;
  address: string;
}

const UserSchema = new mongoose.Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
});

const UserModel = mongoose.model<User>("User", UserSchema);

export default UserModel;
