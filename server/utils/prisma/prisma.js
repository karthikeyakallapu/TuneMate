import {PrismaClient} from "@prisma/client";

let prismaInstance = null;

export const getPrismaInstance = async () => {
    if (!prismaInstance) {
        prismaInstance = new PrismaClient({
            datasourceUrl: process.env.DATABASE_URL,
        });
    }
    return prismaInstance;
}
