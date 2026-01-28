
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Verifying DB Schema...");
    try {
        const user = await prisma.user.upsert({
            where: { email: "test_verifier@example.com" },
            update: {
                workStyles: ["#Tester"],
                futureRole: "QA Engineer"
            },
            create: {
                email: "test_verifier@example.com",
                firebaseUid: "test_uid_12345",
                name: "Verifier",
                workStyles: ["#Tester"],
                futureRole: "QA Engineer"
            }
        });
        console.log("✅ Success! User upserted with new fields:", user);
    } catch (e) {
        console.error("❌ Failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
