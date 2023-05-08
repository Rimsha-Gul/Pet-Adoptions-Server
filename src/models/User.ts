import mongoose from "mongoose";
//import mongooseSequence from "mongoose-sequence";

//const AutoIncrement = mongooseSequence(mongoose);

//const AutoIncrement = AutoIncrementFactory(mongoose);

interface User {
  name: string;
  email: string;
  address: string;
  password: string;
  tokens: [{ accessToken: string }, { refreshToken: string }];
}

const UserSchema = new mongoose.Schema<User>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    password: { type: String, required: true },
    tokens: [
      {
        accessToken: {
          type: String,
          required: true,
        },
        refreshToken: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

//UserSchema.plugin(AutoIncrement, { inc_field: "id" });

const UserModel = mongoose.model<User>("User", UserSchema);

export default UserModel;
