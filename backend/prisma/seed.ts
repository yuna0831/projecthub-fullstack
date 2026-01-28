
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

    // Create Test User
    const testUser = await prisma.user.upsert({
        where: { email: 'badger@wisc.edu' },
        update: {},
        create: {
            email: 'badger@wisc.edu',
            firebaseUid: 'test-badger-uid',
            name: 'Bucky Badger',
            major: 'Computer Science',
            year: 'Senior',
            bio: 'I love Wisconsin!',
        }
    });

    console.log('Created test user:', testUser.id);

    // Create Test Projects
    const projects = [
        {
            title: 'Study Group for Red-Black Trees',
            description: 'Looking for groupmates to study for the upcoming CS400 exam. We will focus on balancing trees and complexity analysis.',
            courseCode: 'CS400',
            isCourseProject: true,
            meetingType: 'OFFLINE',
            location: 'College Library',
            ownerId: testUser.id,
            techStacks: {
                create: [{ name: 'Java' }, { name: 'Git' }]
            }
        },
        {
            title: 'AI Chess Bot',
            description: 'Building a chess bot using Minimax algorithm for our CS540 final project.',
            courseCode: 'CS540',
            isCourseProject: true,
            meetingType: 'HYBRID',
            ownerId: testUser.id,
            techStacks: {
                create: [{ name: 'Python' }, { name: 'PyTorch' }]
            }
        },
        {
            title: 'Badger Map App',
            description: 'A React Native app to find the best study spots on campus for CS571.',
            courseCode: 'CS571',
            isCourseProject: true,
            meetingType: 'ONLINE',
            ownerId: testUser.id,
            techStacks: {
                create: [{ name: 'React Native' }, { name: 'Expo' }]
            }
        },
        {
            title: 'Hack the Tunnels',
            description: 'Join our team for MadHacks! We are building an AR game for campus navigation.',
            hackathonName: 'MadHacks',
            category: 'Hackathon',
            meetingType: 'OFFLINE',
            location: 'CS Building',
            ownerId: testUser.id,
            techStacks: {
                create: [{ name: 'ARKit' }, { name: 'Unity' }]
            }
        },
        {
            title: 'Clap Analysis',
            description: 'Analyzing the acoustics of clapping in Music 113. Easy A project?',
            courseCode: 'MUSIC113',
            isCourseProject: true,
            meetingType: 'OFFLINE',
            location: 'Humanities',
            ownerId: testUser.id
        }
    ];

    for (const p of projects) {
        await prisma.project.create({
            data: p
        });
    }

    console.log('Created test projects.');

    console.log('Seeding finished.');
}


main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
