require('dotenv').config();
const prisma = require('./src/lib/prisma');

async function test() {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        participants: true
      }
    });
    console.log('Meetings in database:', meetings.length);
    console.log(JSON.stringify(meetings, null, 2));
  } catch (err) {
    console.error('TEST FAILED!');
    console.error(err);
  } finally {
    process.exit();
  }
}

test();
