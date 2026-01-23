import admin from '../src/config/firebase';
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();
const db = admin.firestore();

async function runBenchmark() {
    console.log("🚀 Starting Benchmark: Firestore vs PostgreSQL (100 Users)\n");

    const USER_COUNT = 100;
    const BATCH_ID = Date.now();

    // Generate Data
    const testUsers = Array.from({ length: USER_COUNT }).map((_, i) => ({
        uid: `bench_${BATCH_ID}_${i}`,
        email: `bench_user_${BATCH_ID}_${i}@example.com`,
        name: `User ${i}`,
        role: 'USER'
    }));

    // ==========================================
    // 1. PostgreSQL Benchmark
    // ==========================================
    console.log(`--- 🐘 PostgreSQL Testing ---`);

    // Insert
    let start = performance.now();
    await prisma.user.createMany({
        data: testUsers.map(u => ({
            firebaseUid: u.uid,
            email: u.email,
            name: u.name,
            role: 'USER'
        }))
    });
    let end = performance.now();
    console.log(`[Insert] ${USER_COUNT} Users: ${(end - start).toFixed(2)}ms`);

    // Query (Simple Filter)
    start = performance.now();
    const pgResults = await prisma.user.findMany({
        where: {
            email: { startsWith: `bench_user_${BATCH_ID}` } // SQL LIKE '...'
        }
    });
    end = performance.now();
    console.log(`[Query] Find by Email Prefix: ${(end - start).toFixed(2)}ms`);
    console.log(`[Check] Found ${pgResults.length} users\n`);


    // ==========================================
    // 2. Firestore Benchmark
    // ==========================================
    console.log(`--- 🔥 Firestore Testing ---`);

    // Insert (Batch writes are the fastest way in Firestore)
    start = performance.now();
    const batch = db.batch();
    testUsers.forEach(u => {
        const ref = db.collection('benchmark_users').doc(u.uid);
        batch.set(ref, u);
    });
    await batch.commit();
    end = performance.now();
    console.log(`[Insert] ${USER_COUNT} Users (Batch): ${(end - start).toFixed(2)}ms`);

    // Query
    start = performance.now();
    // Firestore prefix match trick: where('field', '>=', 'prefix') AND where('field', '<=', 'prefix\uf8ff')
    const fsQuery = db.collection('benchmark_users')
        .where('email', '>=', `bench_user_${BATCH_ID}`)
        .where('email', '<=', `bench_user_${BATCH_ID}\uf8ff`);

    const snapshot = await fsQuery.get();
    end = performance.now();
    console.log(`[Query] Find by Email Prefix: ${(end - start).toFixed(2)}ms`);
    console.log(`[Check] Found ${snapshot.size} users\n`);

    console.log("✅ Benchmark Completed.");

    // Cleanup (Optional)
    console.log("(Note: Test data 'bench_...' remains in DB for verification. Run cleanup if needed.)");
}

runBenchmark()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
