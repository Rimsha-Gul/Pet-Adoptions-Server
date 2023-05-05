// import { Request, Response } from "express";

// interface SignupRequest {
//   name: string;
//   age: number;
//   email: string;
//   password: string;
//   address: string;
// }

// export const signup = async (
//   req: Request<{}, {}, SignupRequest>,
//   res: Response
// ) => {
//   // Logic for creating a new user
//   const user = {
//     name: req.body.name,
//     age: req.body.age,
//     email: req.body.email,
//     password: req.body.password,
//     address: req.body.address,
//   };

//   // Return the new user
//   res.status(201).json(user);
// };
