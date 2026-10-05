import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./routes/v1/user";
import bookRouter from "./routes/v1/books";
import adminRouter from "./routes/v1/admin/adminRouter";
import sellBookRouter from "./routes/v1/admin/sellBook";
import genreRouter from "./routes/v1/admin/genres";
import checkOutRouter from "./routes/v1/checkOut";
import adminOrderRoute from "./routes/v1/admin/orders";

import { checkRole, auth } from "./middlewares/auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({origin:'http://localhost:5173', credentials: true}));
app.use(cookieParser());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/orders",auth, checkOutRouter);


app.use("/api/v1/admin/orders",auth, checkRole("ADMIN"), adminOrderRoute);
app.use("/api/v1/admin/sell-books",auth, checkRole("ADMIN"), sellBookRouter);
app.use("/api/v1/admin/genres",auth, checkRole("ADMIN"), genreRouter);
app.use("/api/v1/admin/", adminRouter);


app.listen(8800, (e)=>{
    if(e){
        console.error(e)
    }
    console.log("Server is running at port 8800!")
});