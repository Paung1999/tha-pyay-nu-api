import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { auth } from "../../middlewares/auth";

const checkOutRouter = Router();

checkOutRouter.post("/checkout", async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = res.locals.user.id;

    if (!userId || !items || !shippingAddress) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const itemIds = items.map((item: any) => item.sellBookId);
      const sellBooks = await tx.sell_Book.findMany({
        where: {
          id: {
            in: itemIds,
          },
        },
        include: {
          book: true,
        },
      });

      let subtotal = 0;
      const orderItemsData = [];

      for (const reqItem of items) {

        if(!reqItem.quantity || reqItem.quantity <= 0){
          return res.status(400).json({msg: "Quantity must be greater than 0"});
        }

        const dbBook = sellBooks.find((b) => b.id == reqItem.sellBookId);

        if (!dbBook || !dbBook.isActive) {
          return res.status(400).json({ msg: "Book not found or not active" });
        }
        if (dbBook.stockQuantity < reqItem.quantity) {
          return res
            .status(400)
            .json({ msg: `Only ${dbBook.stockQuantity} books available` });
        }

        subtotal += dbBook.price * reqItem.quantity;

        orderItemsData.push({
          sellBookId: reqItem.sellBookId,
          quantity: reqItem.quantity,
          unitPriceSnapshot: dbBook.price,
          titleSnapshot: dbBook.book.title,
        });
      }

      const deliveryFee = 0;
      const total = subtotal + deliveryFee;
      const orderNumber = `THP-${Date.now()}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber: orderNumber,
          userId: Number(userId),
          status: "PENDING",
          subtotal: subtotal,
          deliveryFee: deliveryFee,
          total: total,
          shippingAddressSnapshot: shippingAddress,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: true,
        },
      });

      for (const reqItem of items) {
        const updateResult = await tx.sell_Book.updateMany({
          where: { id: reqItem.sellBookId },
          data: {
            stockQuantity: {
              decrement: reqItem.quantity,
            },
          },
        });
        if (updateResult.count === 0) {
          throw new Error(`Only ${updateResult.count} books available.`);
        }
      }
      return { newOrder };
    });

    res.status(201).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Something went wrong during checkout!" });
  }
});

//Getting client's orders
checkOutRouter.get("/", async (req, res) => {
  try {
    const { id: userId } = res.locals.user;
    const myOrders = await prisma.order.findMany({
      where: { userId: Number(userId) },
      include: {
        orderItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(myOrders);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Something went wrong" });
  }
});


//Getting client's specific order detail
checkOutRouter.get("/:orderNumber", async(req ,res )=>{
  try{
    const {orderNumber} = req.params;
    const {id: userId} = res.locals.user;
    if(!orderNumber){
      return res.status(400).json({msg: "Order number is required"});
    }
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: orderNumber,
        userId: Number(userId)
      },
      include: {
        orderItems: {
          include: {
            sellBook: {
              include: {
                book: true
              }
            }
          }
        }
      }
    
    });
    if(userId !== order?.userId){
      return res.status(403).json({msg: "You are not authorized to view this order"});
    }

    if(!order){
      return res.status(404).json({msg: "Order not found"});
    }
    
    res.json(order);
    console.log("Order Data:", order);

  }catch(err){
    console.log(err);
    res.status(500).json({msg: "Something went wrong"})
  }
})

export default checkOutRouter;
